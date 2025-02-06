import {
	ApplicationCommandOptionType,
	type GuildMember,
	type CommandInteraction,
} from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { LoadType } from "shoukaku";
import { EMBEDTYPE } from "@/instances";
import type { Mika, PlayerManager } from "@/instances";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerCurrent,
	IsPlayerInit,
} from "@/guards";

@Discord()
class Play {
	@Slash({ description: "Play a music" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerInit, IsPlayerCurrent)
	async play(
		@SlashOption({
			name: "query",
			description: "The search query. Could be name or URL",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		query: string,

		@SlashChoice({ name: "Soundcloud", value: "scsearch" })
		@SlashChoice({ name: "Youtube", value: "ytsearch" })
		@SlashChoice({ name: "Youtube Music", value: "ytmsearch" })
		@SlashOption({
			name: "method",
			description: "The search method. Defaults to Soundcloud",
			required: false,
			type: ApplicationCommandOptionType.String,
		})
		method = "scsearch",

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	): Promise<void> {
		const { player, member } = data;

		try {
			await player.addMusic(query, method, member, interaction);
		} catch (error) {
			client.pino.error(error);
			const embed = client.embed.createMessageEmbedWithAuthor(
				"⛔ There is an error while trying to play music ⛔",
				member,
				EMBEDTYPE.ERROR,
			);
			await client.interaction.replyEmbed(interaction, embed);
		}
	}
}

export { Play };
