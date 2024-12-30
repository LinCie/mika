import { MikaCommands, type Mika } from "@/instances";
import { SlashCommandBuilder, type CommandInteraction } from "discord.js";

const data = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Ping the bot")
	.toJSON();

export default class Ping extends MikaCommands {
	constructor(client: Mika, interaction: CommandInteraction) {
		super(client, interaction);
		this.commandOptions = { isDeferred: true };
	}

	async main(): Promise<void> {
		await this.interaction.editReply("Pong!");
	}
}

export { data };
