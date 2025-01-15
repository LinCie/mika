import type { Mika } from "./Mika";
import type {
	CommandInteraction,
	GuildMember,
	TextChannel,
	VoiceBasedChannel,
} from "discord.js";
import { MikaQueue, QueueEvents } from "./Queue";
import type { Player, Track, TrackStartEvent } from "shoukaku";
import { EMBEDTYPE } from "./manager/EmbedManager";

enum PlayerState {
	Idle = "idle",
	Playing = "playing",
	Changing = "changing",
	Stopping = "stopping",
}

enum LoopState {
	LoopingNone = "loopingNone",
	LoopingCurrent = "loopingCurrent",
	LoopingQueue = "loopingQueue",
}

class MikaPlayer {
	private readonly client: Mika;
	private readonly interaction: CommandInteraction;
	private leaveTimer: Timer | undefined;
	public readonly member: GuildMember;
	public readonly guild: string;
	public readonly channel: TextChannel;
	public player: Player | undefined;
	public queue: MikaQueue;
	public voice: VoiceBasedChannel | null | undefined;
	public state: PlayerState;
	public loopState: LoopState;

	constructor(client: Mika, interaction: CommandInteraction) {
		this.client = client;
		this.interaction = interaction;
		this.member = this.interaction.member as GuildMember;
		this.guild = this.interaction.guild?.id!;
		this.channel = this.client.channels.cache.get(
			this.interaction.channel?.id!,
		) as TextChannel;
		this.state = PlayerState.Idle;
		this.loopState = LoopState.LoopingNone;

		// Queue
		this.queue = new MikaQueue(this.client);
		this.queue.on(QueueEvents.TRACK_ADDED, async (track: Track) => {
			if (this.state === PlayerState.Idle) {
				if (this.queue.current === this.queue.getLength() - 2) {
					await this.playMusic(this.queue.playNext()!);
				} else {
					await this.playMusic(track);
				}
				this.state = PlayerState.Playing;
			}
		});
		this.queue.on(QueueEvents.TRACKS_ADDED, async (tracks: Array<Track>) => {
			if (this.state === PlayerState.Idle) {
				if (this.queue.current === this.queue.getLength() - tracks.length - 1) {
					await this.playMusic(this.queue.playNext()!);
				} else {
					await this.playMusic(tracks[0]);
				}
				this.state = PlayerState.Playing;
			}
		});
	}

	public async init(): Promise<MikaPlayer> {
		this.player = await this.client.shoukaku.joinVoiceChannel({
			guildId: this.interaction.guild?.id!,
			channelId: this.member.voice.channel?.id!,
			shardId: 0,
			deaf: true,
		});
		this.client.players.set(this.guild, this);
		this.voice = this.member.voice.channel;

		this.player?.on("start", async (data) => {
			this.handleTimerExist();
			await this.handleOnPlayerStart(data);
		});

		this.player?.on("end", async () => {
			this.handleTimerExist();

			if (this.loopState === LoopState.LoopingCurrent) {
				await this.handleLoopingCurrent();
			} else if (this.state === PlayerState.Changing) {
				this.state = PlayerState.Playing;
			} else if (this.queue.current < this.queue.getLength() - 1) {
				await this.handlePlayNext();
			} else if (this.queue.current === this.queue.getLength() - 1) {
				await this.handleLastTrack();
			}
		});

		this.player?.on("closed", async () => {
			await this.handleOnPlayerClosed();
		});

		return this;
	}

	// Getter

	private getNode() {
		const node = this.client.shoukaku.options.nodeResolver(
			this.client.shoukaku.nodes,
		);
		if (!node) {
			this.client.pino.error("No node was found");
			return;
		}
		return node;
	}

	private getSearchQuery(query: string, method: string) {
		let search = query;

		try {
			// Check if query is a valid URL
			new URL(query);
		} catch {
			search = `${method}:${query}`;
		}

		return search;
	}

	public getNextPlaying(): Track | undefined {
		let next: Track | undefined;
		switch (this.loopState) {
			case LoopState.LoopingCurrent: {
				next = this.queue.getCurrent();
				break;
			}

			case LoopState.LoopingQueue: {
				const nextTrack = this.queue.getNext();
				if (nextTrack) {
					next = nextTrack;
				} else {
					next = this.queue.getTrack(0);
				}
				break;
			}
			default: {
				next = this.queue.getNext();
				break;
			}
		}

		return next;
	}

	// Utils

	public async leaveVoiceChannel() {
		await this.client.shoukaku.leaveVoiceChannel(this.interaction.guild?.id!);
	}

	public async searchMusic(query: string, method: string) {
		const node = this.getNode();
		const search = this.getSearchQuery(query, method);
		return await node?.rest.resolve(search);
	}

	public async playMusic(track: Track) {
		await this.player?.playTrack({
			volume: 50,
			track: { encoded: track.encoded },
		});
	}

	public async skipMusic() {
		await this.player?.stopTrack();
	}

	public async removePlayer(): Promise<void> {
		await this.leaveVoiceChannel();
		this.player?.removeAllListeners();
		await this.player?.destroy();
		this.player = undefined;
		this.queue.destroy();
		this.client.players.delete(this.guild);
	}

	// Handles

	private async handleLoopingCurrent(): Promise<void> {
		await this.playMusic(this.queue.getCurrent()!);
	}

	private async handleLoopingQueue(): Promise<void> {
		this.queue.resetQueue();
		await this.playMusic(this.queue.playCurrent()!);
	}

	private async handlePlayNext(): Promise<void> {
		const track = this.queue.playNext();
		if (track) await this.playMusic(track);
	}

	private async handleLastTrack(): Promise<void> {
		if (this.loopState === LoopState.LoopingQueue) {
			await this.handleLoopingQueue();
		} else {
			const time = `<t:${Math.floor(Date.now() / 1000) + 120}:R>`;
			const embed = this.client.embed.createMessageEmbed(
				`🎶 Queue is currently empty, leaving voice channel ${time} if no new track is added 🎶`,
				EMBEDTYPE.WARNING,
			);

			if (this.state !== PlayerState.Stopping) {
				this.state = PlayerState.Idle;
				await this.channel.send({ embeds: [embed] });
				this.leaveTimer = setTimeout(async () => {
					await this.removePlayer();
				}, 120000);
				this.player?.once("start", () => {
					clearTimeout(this.leaveTimer);
					this.leaveTimer = undefined;
				});
			}
		}
	}

	private async handleOnPlayerStart(data: TrackStartEvent): Promise<void> {
		const next = this.getNextPlaying();
		const embed = this.client.embed.createPlayingEmbed(data.track, next);
		await this.channel.send({ embeds: [embed] });
	}

	private async handleOnPlayerClosed(): Promise<void> {
		const embed = this.client.embed.createMessageEmbed(
			"🎶 Leaving voice channel now! Thank you for using Mika 🩷 🎶",
			EMBEDTYPE.GLOBAL,
		);
		await this.channel.send({ embeds: [embed] });
	}

	private handleTimerExist() {
		if (this.leaveTimer) {
			clearTimeout(this.leaveTimer);
			this.leaveTimer = undefined;
		}
	}
}

export { MikaPlayer, PlayerState, LoopState };
