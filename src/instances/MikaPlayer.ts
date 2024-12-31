import type { Mika } from "./Mika";
import {
	EmbedBuilder,
	type CommandInteraction,
	type GuildMember,
	type TextChannel,
	type VoiceBasedChannel,
} from "discord.js";
import { MikaQueue, QueueEvents } from "./MikaQueue";
import type { Player, Track } from "shoukaku";
import { GLOBAL_COLOR } from "@/config";

class MikaPlayer {
	public readonly client: Mika;
	public readonly interaction: CommandInteraction;
	public readonly member: GuildMember;
	public readonly guild: string;
	public readonly channel: TextChannel;
	public player: Player | undefined;
	public voice: VoiceBasedChannel | null | undefined;
	public isPlaying: boolean;
	public isChanging: boolean;
	public queue: MikaQueue;

	constructor(client: Mika, interaction: CommandInteraction) {
		this.client = client;
		this.interaction = interaction;
		this.member = this.interaction.member as GuildMember;
		this.guild = this.interaction.guild?.id!;
		this.channel = this.client.channels.cache.get(
			this.interaction.channel?.id!,
		) as TextChannel;
		this.isPlaying = false;
		this.isChanging = false;

		// Queue
		this.queue = new MikaQueue();
		this.queue.on(QueueEvents.TRACK_ADDED, async (track: Track) => {
			if (!this.isPlaying) {
				if (this.queue.current === this.queue.getLength() - 2) {
					await this.playMusic(this.queue.playNext()!);
				} else {
					await this.playMusic(track);
				}
				this.isPlaying = true;
			}
		});
		this.queue.on(QueueEvents.TRACKS_ADDED, async (tracks: Array<Track>) => {
			if (!this.isPlaying) {
				if (this.queue.current === this.queue.getLength() - tracks.length - 1) {
					await this.playMusic(this.queue.playNext()!);
				} else {
					await this.playMusic(tracks.shift()!);
				}
				this.isPlaying = true;
			}
		});
	}

	/**
	 * Enters the voice channel and sets up the player for music playback.
	 *
	 * It will join the voice channel the member is currently in, and set up the
	 * player to play the next track in the queue when the current track has
	 * finished playing.
	 *
	 * @throws {Error} If the member is not in a voice channel.
	 */
	public async init() {
		this.player = await this.client.shoukaku.joinVoiceChannel({
			guildId: this.interaction.guild?.id!,
			channelId: this.member.voice.channel?.id!,
			shardId: 0,
			deaf: true,
		});
		this.client.players.set(this.guild, this);
		this.voice = this.member.voice.channel;

		this.player?.on("start", async (data) => {
			const length = `<t:${Math.floor(Date.now() / 1000) + Math.floor(data.track.info.length / 1000)}:R>`;
			const playEmbed = new EmbedBuilder()
				.setColor(GLOBAL_COLOR)
				.setTitle(data.track.info.title)
				.setURL(data.track.info.uri!)
				.setAuthor({
					name: this.member.nickname!,
					iconURL: this.member.avatarURL()!,
				})
				.setDescription(
					`🎶 **${data.track.info.title}** is currently playing 🎶`,
				)
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
						value: this.queue.getNext()?.info.title || "No track left",
					},
				)
				.setTimestamp()
				.setFooter({
					text: "Made with 🩷 by LinCie",
					iconURL:
						"https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png",
				});

			await this.channel.send({ embeds: [playEmbed] });
		});

		this.player?.on("end", async () => {
			if (this.queue.current < this.queue.getLength() - 1) {
				const track = this.queue.playNext();
				if (track) await this.playMusic(track);
			} else if (this.isChanging) {
				// Do nothing
			} else {
				this.isPlaying = false;
				const embed = new EmbedBuilder()
					.setColor(GLOBAL_COLOR)
					.setDescription("🎶 Queue is currently empty 🎶");
				await this.channel.send({ embeds: [embed] });
			}
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

	public async playMusic(track: Track) {
		await this.player?.playTrack({
			volume: 50,
			track: { encoded: track.encoded },
		});
	}

	public async skipMusic() {
		await this.player?.stopTrack();
	}
}

export { MikaPlayer };
