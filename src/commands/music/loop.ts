import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";
import type { Mika, MikaPlayer } from "@/instances";
import {
	type GuildMember,
	type CommandInteraction,
	ApplicationCommandOptionType,
} from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";

@Discord()
class Loop {
	@Slash({ description: "Loop track" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async loop(
		@SlashChoice({ name: "Off", value: "off" })
		@SlashChoice({ name: "Current", value: "current" })
		@SlashChoice({ name: "Queue", value: "queue" })
		@SlashOption({
			name: "method",
			description: "The looping method. Defaults to current",
			required: false,
			type: ApplicationCommandOptionType.String,
		})
		method: "current" | "queue" | "off" | undefined,
		interaction: CommandInteraction,
		client: Mika,
		data: { player: MikaPlayer; member: GuildMember },
	) {
		const { player, member } = data;
		player.isLooping = method || "current";

		switch (method) {
			case "current": {
				const current = player.queue.getCurrent()!;
				await client.sendMessageEmbed(
					interaction,
					member,
					`🎶 Mika is now looping **${current.info.title}** 🎶`,
				);
				break;
			}
			case "queue": {
				await client.sendMessageEmbed(
					interaction,
					member,
					"🎶 Mika is now looping queue 🎶",
				);
				break;
			}
			case "off": {
				await client.sendMessageEmbed(
					interaction,
					member,
					"🎶 Loop is now off 🎶",
				);
				break;
			}
		}
	}
}

export { Loop };
