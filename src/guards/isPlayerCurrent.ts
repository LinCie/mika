import type { CommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";
import { EMBEDTYPE, type Mika, type MikaPlayer } from "@/instances";

const IsPlayerCurrent: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
	data: { member?: GuildMember; player?: MikaPlayer },
) => {
	const mika = client as Mika;
	const member = data.member || (interaction.member as GuildMember);
	const player = data.player || mika.players.get(interaction.guild?.id!);

	if (player?.voice?.id !== member.voice.channel?.id) {
		const embed = mika.embed.createMessageEmbedWithAuthor(
			"You're currently not in the same voice channel with the player",
			member,
			EMBEDTYPE.ERROR,
		);

		await mika.interaction.replyEmbed(interaction, embed, { ephemeral: true });
		return;
	}

	data.member = member;
	data.player = player;
	await next();
	return;
};

export { IsPlayerCurrent };
