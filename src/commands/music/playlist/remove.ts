import {
	type GuildMember,
	type CommandInteraction,
	type EmbedBuilder,
	ApplicationCommandOptionType,
} from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Prisma } from "@prisma/client";
import { EMBEDTYPE, type Mika } from "@/instances";
import { DeferReply } from "@/guards";
import type { Track } from "shoukaku";

@Discord()
@SlashGroup({ name: "playlist", description: "Playlist Manager" })
@SlashGroup("playlist")
class Playlist {
	@Slash({ description: "Remove a track from playlist" })
	@Guard(DeferReply)
	async remove(
		@SlashOption({
			name: "name",
			description: "The playlist name",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		name: string,

		@SlashOption({
			name: "position",
			description: "The position of removed track",
			required: true,
			type: ApplicationCommandOptionType.Number,
		})
		position: number,

		interaction: CommandInteraction,
		client: Mika,
	) {
		const member = interaction.member as GuildMember;

		try {
			const playlist = await client.playlist.getPlaylistByName(
				name.toLowerCase(),
			);
			const tracks: Track[] = JSON.parse(playlist.musics);
			const truePosition = position - 1;

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

			if (truePosition < 0 || truePosition > tracks.length) {
				const embed = client.embed.createMessageEmbedWithAuthor(
					`⛔ Position **${position}** is out of range ⛔`,
					member,
					EMBEDTYPE.ERROR,
				);

				await client.interaction.replyEmbed(interaction, embed, {
					ephemeral: true,
				});
			}

			const removedTrack = tracks[truePosition];
			playlist.musics = JSON.stringify(
				tracks.filter((track, idx) => idx !== truePosition),
			);
			await client.playlist.updatePlaylist(playlist);

			const embed = client.embed.createMessageEmbedWithAuthor(
				`🎶 **${removedTrack.info.title}** has been removed from playlist **${name}** 🎶`,
				member,
				EMBEDTYPE.SUCCESS,
			);
			await client.interaction.replyEmbed(interaction, embed);
		} catch (error) {
			client.pino.error(error);

			let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
				`⛔ There is an error while trying to remove track from playlist **${name}** ⛔`,
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
