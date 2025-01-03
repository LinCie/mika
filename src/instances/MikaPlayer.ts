import type { Mika } from "./Mika";
import {
	EmbedBuilder,
	type CommandInteraction,
	type GuildMember,
	type TextChannel,
	type VoiceBasedChannel,
} from "discord.js";
import { MikaQueue, QueueEvents } from "./MikaQueue";
import type { Player, Track, TrackStartEvent } from "shoukaku";
import { GLOBAL_COLOR } from "@/config";

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

	/**
	 * Initializes the player by joining the voice channel and setting up event listeners.
	 *
	 * @returns {Promise<MikaPlayer>} The initialized MikaPlayer instance.
	 *
	 * Joins the voice channel of the member initiating the interaction, stores the player instance,
	 * and sets up event listeners for track start and end. On track start, it sends an embed message
	 * to the channel with track information and the next track in queue. On track end, it handles
	 * looping logic and plays the next track in the queue or notifies if the queue is empty.
	 */
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
			await this.handleOnPlayerStart(data);
		});

		this.player?.on("end", async () => {
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

	/**
	 * Leave the voice channel.
	 *
	 * @throws {Error} If the member is not in a voice channel.
	 */
	public async leaveVoiceChannel() {
		await this.client.shoukaku.leaveVoiceChannel(this.interaction.guild?.id!);
	}

	/**
	 * Retrieves a Shoukaku node using the configured node resolver.
	 *
	 * Logs an error if no node is found.
	 *
	 * @returns The resolved Shoukaku node or undefined if no node is available.
	 */
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

	/**
	 * Creates a search query for Shoukaku using the provided query and search method.
	 *
	 * If the query is a valid URL, it is used as is. Otherwise, the search method is prepended to the query.
	 *
	 * @param {string} query The search query.
	 * @param {string} method The search method.
	 * @returns The search query.
	 */
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

	/**
	 * Searches for music using Shoukaku.
	 *
	 * @param {string} query The search query.
	 * @param {string} method The search method.
	 * @returns The search result.
	 */
	public async searchMusic(query: string, method: string) {
		const node = this.getNode();
		const search = this.getSearchQuery(query, method);
		return await node?.rest.resolve(search);
	}

	/**
	 * Plays a track.
	 *
	 * @param {Track} track The track to play.
	 */
	public async playMusic(track: Track) {
		await this.player?.playTrack({
			volume: 50,
			track: { encoded: track.encoded },
		});
	}

	/**
	 * Stops the currently playing track.
	 *
	 * Skips the current track and moves onto the next one in the queue.
	 */
	public async skipMusic() {
		await this.player?.stopTrack();
	}

	/**
	 * Removes the player from the server.
	 *
	 * Leaves the voice channel, destroys the player, and removes the player from the client's player map.
	 */
	public async removePlayer(): Promise<void> {
		await this.leaveVoiceChannel();
		this.player?.removeAllListeners();
		await this.player?.destroy();
		this.player = undefined;
		this.queue.destroy();
		this.client.players.delete(this.guild);
	}

	/**
	 * Handles when the player should loop the current track.
	 *
	 * @private
	 * @returns {Promise<void>}
	 */
	private async handleLoopingCurrent(): Promise<void> {
		await this.playMusic(this.queue.getCurrent()!);
	}

	/**
	 * Handles when the player should loop the entire queue.
	 *
	 * Resets the queue to the beginning and plays the first track in the queue.
	 * @private
	 * @returns {Promise<void>}
	 */
	private async handleLoopingQueue(): Promise<void> {
		this.queue.resetQueue();
		await this.playMusic(this.queue.playCurrent()!);
	}

	/**
	 * Handles when the player should play the next track.
	 *
	 * Retrieves the next track in the queue and plays it.
	 * @private
	 * @returns {Promise<void>}
	 */
	private async handlePlayNext(): Promise<void> {
		const track = this.queue.playNext();
		if (track) await this.playMusic(track);
	}

	/**
	 * Handles when the player is finished playing tracks.
	 *
	 * If the player is set to loop the queue, resets the queue and plays the first track.
	 * Otherwise, sends a message to the channel that the queue is empty and will leave the voice channel in 2 minutes if no new track is added,
	 * and waits for 2 minutes before leaving the voice channel if no new track is added.
	 * @private
	 * @returns {Promise<void>}
	 */
	private async handleLastTrack(): Promise<void> {
		if (this.loopState === LoopState.LoopingQueue) {
			await this.handleLoopingQueue();
		} else {
			const time = `<t:${Math.floor(Date.now() / 1000) + 120}:R>`;
			const embed = new EmbedBuilder()
				.setColor(GLOBAL_COLOR)
				.setDescription(
					`🎶 Queue is currently empty, leaving voice channel ${time} if no new track is added 🎶`,
				)
				.setTimestamp()
				.setFooter({
					text: "Made with 🩷 by LinCie",
					iconURL:
						"https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png",
				});

			if (this.state !== PlayerState.Stopping) {
				this.state = PlayerState.Idle;

				await this.channel.send({ embeds: [embed] });

				this.player?.once("start", () => clearTimeout(timer));
				const timer = setTimeout(async () => {
					await this.removePlayer();
				}, 120000);
			}
		}
	}

	private async handleOnPlayerStart(data: TrackStartEvent): Promise<void> {
		const length = `<t:${Math.floor(Date.now() / 1000) + Math.floor(data.track.info.length / 1000)}:R>`;
		let next: Track | undefined;

		switch (this.loopState) {
			case LoopState.LoopingCurrent: {
				next = data.track;
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

		const playEmbed = new EmbedBuilder()
			.setColor(GLOBAL_COLOR)
			.setTitle(data.track.info.title)
			.setURL(data.track.info.uri!)
			.setAuthor({
				name: this.member.nickname!,
				iconURL: this.member.avatarURL()!,
			})
			.setDescription(`🎶 **${data.track.info.title}** is currently playing 🎶`)
			.setThumbnail(data.track.info.artworkUrl!)
			.addFields(
				{
					name: "Title",
					value: data.track.info.title,
					inline: true,
				},
				{
					name: "Artist",
					value: data.track.info.author,
					inline: true,
				},
				{
					name: "Next track in",
					value: length,
				},
				{
					name: "Next in queue",
					value: next?.info.title! || "No track left",
				},
			)
			.setTimestamp()
			.setFooter({
				text: "Made with 🩷 by LinCie",
				iconURL:
					"https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png",
			});

		await this.channel.send({ embeds: [playEmbed] });
	}

	/**
	 * Handles when the player is closed.
	 *
	 * Sends a message to the text channel the player was created in, thanking the user for using Mika.
	 * @private
	 * @returns {Promise<void>}
	 */
	private async handleOnPlayerClosed(): Promise<void> {
		const embed = new EmbedBuilder()
			.setColor(GLOBAL_COLOR)
			.setDescription(
				"🎶 Leaving voice channel now! Thank you for using Mika 🩷 🎶",
			)
			.setTimestamp()
			.setFooter({
				text: "Made with 🩷 by LinCie",
				iconURL:
					"https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png",
			});

		await this.channel.send({ embeds: [embed] });
	}
}

export { MikaPlayer, PlayerState, LoopState };
