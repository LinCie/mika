import type { CommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";
import { EMBEDTYPE, type Mika } from "@/instances";

const IsInVoiceChannel: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
	data: { member: GuildMember },
) => {
	const mika = client as Mika;
	const member = data.member || (interaction.member as GuildMember);

	if (!member.voice.channel) {
		const embed = mika.embed.createMessageEmbedWithAuthor(
			"You're currently not in a voice channel!",
			member,
			EMBEDTYPE.ERROR,
		);
		await mika.interaction.replyEmbed(interaction, embed, { ephemeral: true });
		return;
	}

	data.member = member;
	await next();
	return;
};

export { IsInVoiceChannel };
