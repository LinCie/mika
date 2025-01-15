import type { GuildMember, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import { EMBEDTYPE, type Mika, type MikaPlayer } from "@/instances";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";

@Discord()
class Shuffle {
	@Slash({ description: "Shuffles current queue" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async shuffle(
		interaction: CommandInteraction,
		client: Mika,
		data: { player: MikaPlayer; member: GuildMember },
	) {
		const { player, member } = data;
		player.queue.shuffleQueue();
		const embed = client.embed.createMessageEmbedWithAuthor(
			"🎶 Queue has been shuffled 🎶",
			member,
			EMBEDTYPE.SUCCESS,
		);
		await client.interaction.replyEmbed(interaction, embed);
	}
}

export { Shuffle };
