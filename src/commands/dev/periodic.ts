import {
	ApplicationCommandOptionType,
	type User,
	type CommandInteraction,
} from "discord.js";
import { Discord, Guard, Guild, Slash, SlashOption } from "discordx";
import { DeferReply, IsOwner } from "@/guards";
import type { Mika } from "@/instances";
import { DEV_GUILD_ID } from "@/config";

@Discord()
class Periodic {
	@Slash({ description: "Send periodic message to member" })
	@Guild(DEV_GUILD_ID)
	@Guard(DeferReply, IsOwner)
	async periodic(
		@SlashOption({
			name: "user",
			description: "The user you want to send message to",
			required: true,
			type: ApplicationCommandOptionType.User,
		})
		user: User,

		@SlashOption({
			name: "message",
			description: "The message",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		message: string,

		interaction: CommandInteraction,
		client: Mika,
	): Promise<void> {
		await interaction.deleteReply();
		await user.send(message);
		function recursiveMessage() {
			setTimeout(
				async () => {
					await user.send(message);
					recursiveMessage();
				},
				6 * 60 * 60 * 1000,
			);
		}
		recursiveMessage();
	}
}

export { Periodic };
