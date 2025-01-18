import {
	type GuildMember,
	type CommandInteraction,
	type EmbedBuilder,
	ApplicationCommandOptionType,
} from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { EMBEDTYPE, type Mika, type PlayerManager } from "@/instances";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";

@Discord()
class Volume {
	@Slash({ description: "Set the player volume" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async volume(
		@SlashOption({
			name: "volume",
			description: "The volume you would like to change",
			required: true,
			type: ApplicationCommandOptionType.Number,
		})
		volume: number,

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;

		if (volume < 0) {
			const embed = client.embed.createMessageEmbedWithAuthor(
				"Volume should not be less than 0",
				member,
				EMBEDTYPE.ERROR,
			);
			await client.interaction.replyEmbed(interaction, embed);
			return;
		}

		if (volume > 1000) {
			const embed = client.embed.createMessageEmbedWithAuthor(
				"Volume should not exceed 1000",
				member,
				EMBEDTYPE.ERROR,
			);
			await client.interaction.replyEmbed(interaction, embed);
			return;
		}

		await player.changeVolume(volume);

		const embed = client.embed.createMessageEmbedWithAuthor(
			`Volume has been successfully changed to ${volume}`,
			member,
			EMBEDTYPE.SUCCESS,
		);
		await client.interaction.replyEmbed(interaction, embed);
		return;
	}
}

export { Volume };
