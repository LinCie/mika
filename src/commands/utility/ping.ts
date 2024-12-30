import { DeferReply } from "@/guards";
import type { Mika } from "@/instances";
import type { CommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";

@Discord()
class Ping {
	@Slash({ description: "ping" })
	@Guard(DeferReply)
	async ping(interaction: CommandInteraction, client: Mika): Promise<void> {
		await interaction.editReply("Pong!");
	}
}

export { Ping };
