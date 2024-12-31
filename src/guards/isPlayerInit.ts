import { MikaPlayer, type Mika } from "@/instances";
import type { CommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";

const IsPlayerInit: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
	data: { player?: MikaPlayer },
) => {
	const mika = client as Mika;
	const player =
		data.player ||
		mika.players.get(interaction.guild?.id!) ||
		(await new MikaPlayer(mika, interaction).init());

	data.player = player;
	await next();
	return;
};

export { IsPlayerInit };
