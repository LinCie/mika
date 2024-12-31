import type { Mika, MikaPlayer } from "@/instances";
import type { CommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";

const IsPlayerAlreadyExist: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
	data: { member?: GuildMember; player?: MikaPlayer },
) => {
	const mika = client as Mika;
	const member = data.member || (interaction.member as GuildMember);
	const player = data.player || mika.players.get(interaction.guild?.id!);

	if (!player) {
		await mika.sendMessageEmbed(
			interaction,
			member,
			"There is no active player in this server",
		);
		return;
	}

	data.member = member;
	data.player = player;
	await next();
	return;
};

export { IsPlayerAlreadyExist };
