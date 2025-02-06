import type { CommandInteraction, GuildMember } from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import { DeferReply } from "@/guards";
import { EMBEDTYPE, type Mika } from "@/instances";

@Discord()
class Ping {
	@Slash({ description: "ping" })
	@Guard(DeferReply)
	async ping(interaction: CommandInteraction, client: Mika): Promise<void> {
		const member = interaction.member as GuildMember;

		const embed = client.embed.createMessageEmbedWithAuthor(
			"Pong!",
			member,
			EMBEDTYPE.GLOBAL,
		);
		await client.interaction.replyEmbed(interaction, embed, {
			ephemeral: false,
		});
	}
}

export { Ping };
