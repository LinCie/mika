import {
	type GuildMember,
	type CommandInteraction,
	ApplicationCommandOptionType,
} from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";
import { EMBEDTYPE, type Mika, type PlayerManager } from "@/instances";

@Discord()
class Remove {
	@Slash({ description: "Remove specified track" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async remove(
		@SlashOption({
			name: "query",
			description: "The search query. Could be name or URL",
			required: true,
			type: ApplicationCommandOptionType.Number,
		})
		index: number,

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;

		if (index > player.queue.getLength() || index < 0) {
			const embed = client.embed.createMessageEmbedWithAuthor(
				"Removed index is out of range",
				member,
				EMBEDTYPE.ERROR,
			);

			return await client.interaction.replyEmbed(interaction, embed, {
				ephemeral: true,
			});
		}

		const removedTrack = player.queue.getTrack(index - 1);
		player.queue.removeTrack(index - 1);

		const embed = client.embed.createMessageEmbedWithAuthor(
			`🎶 **${removedTrack?.info.title}** has been sucessfully skipped 🎶`,
			member,
			EMBEDTYPE.SUCCESS,
		);

		await client.interaction.replyEmbed(interaction, embed);
	}
}

export { Remove };
