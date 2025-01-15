import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";
import { EMBEDTYPE, LoopState, type Mika, type PlayerManager } from "@/instances";
import type { GuildMember, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";

@Discord()
class Skip {
	@Slash({ description: "Skip current track" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async skip(
		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;

		if (!player.queue.getNext() && player.loopState === LoopState.LoopingNone) {
			const embed = client.embed.createMessageEmbedWithAuthor(
				"There is no more track in queue",
				member,
				EMBEDTYPE.ERROR,
			);
			await client.interaction.replyEmbed(interaction, embed, {
				ephemeral: true,
			});
			return;
		}

		await player.skipMusic();

		const current = player.queue.getCurrent()!;
		const embed = client.embed.createMessageEmbedWithAuthor(
			`🎶 **${current.info.title}** has been sucessfully skipped 🎶`,
			member,
			EMBEDTYPE.SUCCESS,
		);
		await client.interaction.replyEmbed(interaction, embed);
	}
}

export { Skip };
