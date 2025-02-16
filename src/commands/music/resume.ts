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
class Resume {
	@Slash({ description: "Resume current player" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async resume(
		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;
		await player.resumeMusic();
		const embed = client.embed.createMessageEmbedWithAuthor(
			"🎶 **Mika** has been resumed 🎶",
			member,
			EMBEDTYPE.SUCCESS,
		);
		await client.interaction.replyEmbed(interaction, embed);
	}
}

export { Resume };
