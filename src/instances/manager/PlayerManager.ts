import type {
	CommandInteraction,
	Guild,
	GuildMember,
	TextChannel,
	VoiceBasedChannel,
} from "discord.js";
import type { Player, Track, TrackStartEvent } from "shoukaku";
import type { Mika } from "../Mika";
import { QueueManager, QueueEvents } from "./QueueManager";
import { EMBEDTYPE } from "./EmbedManager";

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

class PlayerManager {
	private readonly client: Mika;
	private leaveTimer: Timer | undefined;
	public readonly guild: Guild;
	public readonly channel: TextChannel;
	public readonly queue: QueueManager;
	public player: Player | undefined;
	public voice: VoiceBasedChannel | undefined;
	public state: PlayerState;
	public loopState: LoopState;

	constructor(client: Mika, interaction: CommandInteraction) {
		this.client = client;
		this.guild = interaction.guild!;
		this.channel = this.client.channels.cache.get(
			interaction.channel?.id!,
		) as TextChannel;
		this.state = PlayerState.Idle;
		this.loopState = LoopState.LoopingNone;

		// Queue
		this.queue = new QueueManager(this.client);
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

	public async init(interaction: CommandInteraction): Promise<PlayerManager> {
		const member = interaction.member as GuildMember;

		this.player = await this.client.shoukaku.joinVoiceChannel({
			guildId: interaction.guild?.id!,
			channelId: member?.voice.channel?.id!,
			shardId: 0,
			deaf: true,
		});
		this.client.players.set(this.guild.id, this);
		this.voice = member.voice.channel!;

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
		await this.client.shoukaku.leaveVoiceChannel(this.guild.id!);
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
		this.client.players.delete(this.guild.id);
	}

	public async changeVolume(volume: number): Promise<void> {
		await this.player?.setGlobalVolume(volume);
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

export { PlayerManager, PlayerState, LoopState };
