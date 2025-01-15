import { DeferReply } from "@/guards";
import { EMBEDTYPE, type Mika } from "@/instances";
import type { CommandInteraction } from "discord.js";
import { Discord, Guard, Slash } from "discordx";

@Discord()
class Ping {
	@Slash({ description: "ping" })
	@Guard(DeferReply)
	async ping(interaction: CommandInteraction, client: Mika): Promise<void> {
		const embed = client.embed.createMessageEmbed("Pong!", EMBEDTYPE.GLOBAL);
		await client.interaction.replyEmbed(interaction, embed, {
			ephemeral: false,
		});
	}
}

export { Ping };
