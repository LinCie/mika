import {
	type GuildMember,
	type CommandInteraction,
	type EmbedBuilder,
	ApplicationCommandOptionType,
} from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { EMBEDTYPE, type PlayerManager, type Mika } from "@/instances";
import { DeferReply, IsPlayerExist } from "@/guards";
import { Prisma } from "@prisma/client";
import { LoadType, type Track } from "shoukaku";

@Discord()
@SlashGroup({ name: "playlist", description: "Playlist Manager" })
@SlashGroup("playlist")
class Playlist {
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
}

export { Playlist };
