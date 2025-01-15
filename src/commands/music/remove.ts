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
			name: "position",
			description: "The position of removed track",
			required: true,
			type: ApplicationCommandOptionType.Number,
		})
		position: number,

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;

		if (position > player.queue.getLength() || position < 0) {
			const embed = client.embed.createMessageEmbedWithAuthor(
				"Removed position is out of range",
				member,
				EMBEDTYPE.ERROR,
			);

			return await client.interaction.replyEmbed(interaction, embed, {
				ephemeral: true,
			});
		}

		const removedTrack = player.queue.getTrack(position - 1);
		player.queue.removeTrack(position - 1);

		const embed = client.embed.createMessageEmbedWithAuthor(
			`🎶 **${removedTrack?.info.title}** has been sucessfully removed 🎶`,
			member,
			EMBEDTYPE.SUCCESS,
		);

		await client.interaction.replyEmbed(interaction, embed);
	}
}

export { Remove };
