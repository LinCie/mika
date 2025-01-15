import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";
import { PlayerState, type Mika, type PlayerManager } from "@/instances";
import type { GuildMember, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";

@Discord()
class Stop {
	@Slash({ description: "Stop current player" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async stop(
		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player } = data;

		player.state = PlayerState.Stopping;
		await player.removePlayer();
		await interaction.deleteReply();
	}
}

export { Stop };
