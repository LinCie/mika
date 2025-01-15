import type { CommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";
import { EMBEDTYPE, type Mika, type MikaPlayer } from "@/instances";

const IsPlayerExist: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
	data: { member?: GuildMember; player?: MikaPlayer },
) => {
	const mika = client as Mika;
	const member = data.member || (interaction.member as GuildMember);
	const player = data.player || mika.players.get(interaction.guild?.id!);

	if (!player) {
		const embed = mika.embed.createMessageEmbedWithAuthor(
			"There is no active player in this server",
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

export { IsPlayerExist };
