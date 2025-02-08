import {
	type GuildMember,
	type CommandInteraction,
	type EmbedBuilder,
	ApplicationCommandOptionType,
} from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { EMBEDTYPE, type Mika, type PlayerManager } from "@/instances";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
	IsPlayerInit,
} from "@/guards";
import { LoadType, type Track } from "shoukaku";
import { Prisma } from "@prisma/client";

@Discord()
@SlashGroup({ name: "playlist", description: "Playlist Manager" })
@SlashGroup("playlist")
class Playlist {
	/**
	 *	Create playlist command
	 */
	@Slash({ description: "Create a playlist" })
	@Guard(DeferReply)
	async create(
		@SlashOption({
			name: "name",
			description: "The playlist name",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		name: string,

		interaction: CommandInteraction,
		client: Mika,
	) {
		const member = interaction.member as GuildMember;

		try {
			const playlist = await client.playlist.createPlaylist(
				name.toLowerCase(),
				member,
			);

			const embed = client.embed.createMessageEmbedWithAuthor(
				`🎶 Playlist **${playlist.name}** has been created 🎶`,
				member,
				EMBEDTYPE.SUCCESS,
			);
			await client.interaction.replyEmbed(interaction, embed);
		} catch (error) {
			client.pino.error(error);

			let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
				`⛔ There is an error while trying to create playlist **${name}** ⛔`,
				member,
				EMBEDTYPE.ERROR,
			);

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "SQLITE_CONSTRAINT") {
					embed = client.embed.createMessageEmbedWithAuthor(
						"⛔ Playlist name must be unique ⛔",
						member,
						EMBEDTYPE.ERROR,
					);
				}
			}

			await client.interaction.replyEmbed(interaction, embed, {
				ephemeral: true,
			});
		}
	}

	/**
	 *	Add music to playlist command
	 */
	@Slash({ description: "Add a music to playlist" })
	@Guard(DeferReply, IsPlayerExist)
	async add(
		@SlashOption({
			name: "playlist",
			description: "The name of the playlist",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		name: string,

		@SlashOption({
			name: "url",
			description: "The music url",
			required: false,
			type: ApplicationCommandOptionType.String,
		})
		url: string | undefined,

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;

		try {
			let music: Track | Track[] | undefined;
			if (!url) {
				music = player.queue.getCurrent();
			} else {
				const result = await player.searchMusic(url, "url");

				switch (result?.loadType) {
					case LoadType.TRACK:
						music = result.data;
						break;
					case LoadType.PLAYLIST:
						music = result.data.tracks;
						break;
					default:
						throw new Error("Invalid URL");
				}
			}

			const playlist = await client.playlist.getPlaylistByName(
				name.toLowerCase(),
			);

			if (playlist.userId !== member.user.id) {
				const embed = client.embed.createMessageEmbedWithAuthor(
					`⛔ You're not the owner of playlist **${name}** ⛔`,
					member,
					EMBEDTYPE.ERROR,
				);
				await client.interaction.replyEmbed(interaction, embed, {
					ephemeral: true,
				});
				return;
			}

			if (!music) {
				throw new Error("Empty result");
			}

			const musics: Track[] = JSON.parse(playlist.musics);

			if (Array.isArray(music)) {
				for (const track of music) {
					musics.push(track);
				}
			} else {
				musics.push(music);
			}

			await client.playlist.addTrackToPlaylist(playlist.id, {
				...playlist,
				musics: JSON.stringify(musics),
			});

			if (Array.isArray(music)) {
				const embed = client.embed.createMessageEmbedWithAuthor(
					`🎶 Musics has been added to playlist **${playlist.name}** 🎶`,
					member,
					EMBEDTYPE.SUCCESS,
				);
				await client.interaction.replyEmbed(interaction, embed);
			} else {
				const embed = client.embed.createMessageEmbedWithAuthor(
					`🎶 **${music.info.title}** has been added to playlist **${playlist.name}** 🎶`,
					member,
					EMBEDTYPE.SUCCESS,
				);
				await client.interaction.replyEmbed(interaction, embed);
			}
		} catch (error) {
			client.pino.error(error);

			let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
				`⛔ There is an error while trying to add music to playlist **${name}** ⛔`,
				member,
				EMBEDTYPE.ERROR,
			);

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					embed = client.embed.createMessageEmbedWithAuthor(
						`⛔ Playlist **${name}** doesn't exist ⛔`,
						member,
						EMBEDTYPE.ERROR,
					);
				}
			}

			await client.interaction.replyEmbed(interaction, embed, {
				ephemeral: true,
			});
		}
	}

	/**
	 *	Play a playlist command
	 */
	@Slash({ description: "Play a playlist" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerInit, IsPlayerCurrent)
	async play(
		@SlashOption({
			name: "name",
			description: "The playlist name",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		name: string,

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;

		try {
			const playlist = await client.playlist.getPlaylistByName(
				name.toLowerCase(),
			);

			const tracks: Track[] = JSON.parse(playlist.musics);
			player.queue.addTracks(tracks);

			const embed = client.embed.createMessageEmbedWithAuthor(
				`🎶 Playlist **${playlist.name}** has been added to queue 🎶`,
				member,
				EMBEDTYPE.SUCCESS,
			);
			await client.interaction.replyEmbed(interaction, embed);
		} catch (error) {
			client.pino.error(error);

			let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
				`⛔ There is an error while trying to play music from playlist **${name}** ⛔`,
				member,
				EMBEDTYPE.ERROR,
			);

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					embed = client.embed.createMessageEmbedWithAuthor(
						`⛔ Playlist **${name}** doesn't exist ⛔`,
						member,
						EMBEDTYPE.ERROR,
					);
				}
			}

			await client.interaction.replyEmbed(interaction, embed, {
				ephemeral: true,
			});
		}
	}
}

export { Playlist };
