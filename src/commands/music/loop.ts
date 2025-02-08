import {
	type GuildMember,
	type CommandInteraction,
	ApplicationCommandOptionType,
} from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { EMBEDTYPE, LoopState, type Mika, type PlayerManager } from "@/instances";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";

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
		method: LoopState = LoopState.LoopingCurrent,

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;
		player.loopState = method || LoopState.LoopingNone;

		switch (player.loopState) {
			case LoopState.LoopingNone: {
				const embed = client.embed.createMessageEmbedWithAuthor(
					"🎶 Loop is now off 🎶",
					member,
					EMBEDTYPE.SUCCESS,
				);
				await client.interaction.replyEmbed(interaction, embed);
				break;
			}

			case LoopState.LoopingCurrent: {
				const current = player.queue.getCurrent()!;
				const embed = client.embed.createMessageEmbedWithAuthor(
					`🎶 Mika is now looping **${current.info.title}** 🎶`,
					member,
					EMBEDTYPE.SUCCESS,
				);
				await client.interaction.replyEmbed(interaction, embed);
				break;
			}

			case LoopState.LoopingQueue: {
				const embed = client.embed.createMessageEmbedWithAuthor(
					"🎶 Mika is now looping queue 🎶",
					member,
					EMBEDTYPE.SUCCESS,
				);
				await client.interaction.replyEmbed(interaction, embed);
				break;
			}
		}
	}
}

export { Loop };
