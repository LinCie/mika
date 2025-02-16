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
}

export { Playlist };
