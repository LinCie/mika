import {
	type GuildMember,
	type CommandInteraction,
	type EmbedBuilder,
	ApplicationCommandOptionType,
} from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { EMBEDTYPE, type Mika } from "@/instances";
import { DeferReply } from "@/guards";
import { Prisma } from "@prisma/client";

@Discord()
@SlashGroup({ name: "playlist", description: "Playlist Manager" })
@SlashGroup("playlist")
class Playlist {
	@Slash({ description: "Delete a playlist" })
	@Guard(DeferReply)
	async delete(
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

			await client.playlist.deletePlaylist(name.toLowerCase());

			const embed = client.embed.createMessageEmbedWithAuthor(
				`🎶 Playlist **${playlist.name}** has been deleted 🎶`,
				member,
				EMBEDTYPE.SUCCESS,
			);
			await client.interaction.replyEmbed(interaction, embed);
		} catch (error) {
			client.pino.error(error);

			let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
				`⛔ There is an error while trying to delete playlist **${name}** ⛔`,
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
