import type { GuildMember, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";
import {
	EMBEDTYPE,
	PlayerState,
	type Mika,
	type PlayerManager,
} from "@/instances";

@Discord()
class Pause {
	@Slash({ description: "Pause current player" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async pause(
		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;
		await player.pauseMusic();
		const embed = client.embed.createMessageEmbedWithAuthor(
			"🎶 **Mika** has been paused 🎶",
			member,
			EMBEDTYPE.SUCCESS,
		);
		await client.interaction.replyEmbed(interaction, embed);
	}
}

export { Pause };
