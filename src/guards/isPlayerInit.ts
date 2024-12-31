import { MikaPlayer, type Mika } from "@/instances";
import type { CommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";

const IsPlayerInit: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
	data: { player: MikaPlayer },
) => {
	const mika = client as Mika;
	const member = interaction.member as GuildMember;
	const player = mika.players.get(interaction.guild?.id!);

	if (!player) {
		data.player = await new MikaPlayer(mika, interaction).init();
	} else {
		if (player?.channel.id !== member.voice.channel?.id) {
			await mika.sendMessageEmbed(
				interaction,
				member,
				"You're currently not in the same voice channel with the player",
			);
			return;
		}
		data.player = player;
	}

	await next();
	return;
};

export { IsPlayerInit };
