import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";
import { LoopState, type Mika, type MikaPlayer } from "@/instances";
import type { GuildMember, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";

@Discord()
class Skip {
	@Slash({ description: "Skip current track" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async skip(
		interaction: CommandInteraction,
		client: Mika,
		data: { player: MikaPlayer; member: GuildMember },
	) {
		const { player, member } = data;

		if (!player.queue.getNext() && player.loopState === LoopState.LoopingNone) {
			await client.sendMessageEmbed(
				interaction,
				member,
				"There is no more track in queue",
			);
			return;
		}

		const current = player.queue.getCurrent()!;

		await player.skipMusic();
		await client.sendMessageEmbed(
			interaction,
			member,
			`🎶 **${current.info.title}** has been sucessfully skipped 🎶`,
		);
	}
}

export { Skip };
