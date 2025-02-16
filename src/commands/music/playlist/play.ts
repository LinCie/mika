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
	IsPlayerCurrent,
	IsPlayerInit,
} from "@/guards";
import { LoadType, type Track } from "shoukaku";
import { Prisma } from "@prisma/client";

@Discord()
@SlashGroup({ name: "playlist", description: "Playlist Manager" })
@SlashGroup("playlist")
class Playlist {
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
