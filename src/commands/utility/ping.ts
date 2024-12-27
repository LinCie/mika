import { SlashCommandBuilder, CommandInteraction } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Ping the bot")
  .toJSON();

async function execute(interaction: CommandInteraction) {
  await interaction.reply("Pong!");
}

export { data, execute };
