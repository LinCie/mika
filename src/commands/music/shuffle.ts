import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";
import type { Mika, MikaPlayer } from "@/instances";
import type { GuildMember, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";

@Discord()
class Shuffle {
	@Slash({ description: "Shuffle current queue" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async shuffle(
		interaction: CommandInteraction,
		client: Mika,
		data: { player: MikaPlayer; member: GuildMember },
	) {
		const { player, member } = data;

		player.queue.shuffleQueue();
		await client.sendMessageEmbed(
			interaction,
			member,
			"🎶 Queue has been shuffled 🎶",
		);
	}
}

export { Shuffle };
