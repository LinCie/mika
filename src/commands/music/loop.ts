import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";
import { LoopState, type Mika, type MikaPlayer } from "@/instances";
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
		@SlashChoice({ name: "Off", value: LoopState.LoopingNone })
		@SlashChoice({ name: "Current", value: LoopState.LoopingCurrent })
		@SlashChoice({ name: "Queue", value: LoopState.LoopingQueue })
		@SlashOption({
			name: "method",
			description: "The looping method. Defaults to off",
			required: false,
			type: ApplicationCommandOptionType.String,
		})
		method: LoopState | undefined,
		interaction: CommandInteraction,
		client: Mika,
		data: { player: MikaPlayer; member: GuildMember },
	) {
		const { player, member } = data;
		player.loopState = method || LoopState.LoopingNone;

		switch (method) {
			case LoopState.LoopingQueue: {
				await client.sendMessageEmbed(
					interaction,
					member,
					"🎶 Mika is now looping queue 🎶",
				);
				break;
			}
			case LoopState.LoopingNone: {
				await client.sendMessageEmbed(
					interaction,
					member,
					"🎶 Loop is now off 🎶",
				);
				break;
			}
			case LoopState.LoopingCurrent: {
				const current = player.queue.getCurrent()!;
				await client.sendMessageEmbed(
					interaction,
					member,
					`🎶 Mika is now looping **${current.info.title}** 🎶`,
				);
				break;
			}
		}
	}
}

export { Loop };
