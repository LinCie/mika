import { CommandInteraction } from "discord.js";
import { SimpleCommandMessage, type GuardFunction } from "discordx";

const DeferReply: GuardFunction<
	SimpleCommandMessage | CommandInteraction
> = async (interaction, client, next) => {
	if (interaction instanceof CommandInteraction) {
		await interaction.deferReply();
		await next();
	} else if (interaction instanceof SimpleCommandMessage) {
		await next();
	}
};

export { DeferReply };
