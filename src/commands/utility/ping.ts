import type { Mika } from "@/instances";
import { SlashCommandBuilder, type CommandInteraction } from "discord.js";

const data = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Ping the bot")
	.toJSON();

async function execute(client: Mika, interaction: CommandInteraction) {
	await interaction.reply("Pong!");
}

export { data, execute };
