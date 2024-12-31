import type { Mika } from "@/instances";
import type { CommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";

const IsPlayerAlreadyExist: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
) => {
	const mika = client as Mika;
	const member = interaction.member as GuildMember;
	const player = mika.players.get(interaction.guild?.id!);

	if (!player) {
		await mika.sendMessageEmbed(
			interaction,
			member,
			"There is no active player in this server",
		);
		return;
	}

	await next();
	return;
};

export { IsPlayerAlreadyExist };
