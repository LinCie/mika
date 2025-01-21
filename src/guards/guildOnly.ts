import type { CommandInteraction } from "discord.js";
import type { GuardFunction } from "discordx";

const GuildOnly: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
) => {
	if (!interaction.guild) {
		interaction.reply("DM commands are not allowed");
		return;
	}
	await next();
};

export { GuildOnly };
