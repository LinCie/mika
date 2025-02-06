import { OWNER_ID } from "@/config";
import { EMBEDTYPE, type Mika } from "@/instances";
import type { CommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";

const IsOwner: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
	data: { member?: GuildMember },
) => {
	const mika = client as Mika;
	const member = data.member || (interaction.member as GuildMember);
	if (interaction.user.id !== OWNER_ID) {
		const embed = mika.embed.createMessageEmbedWithAuthor(
			"⛔ This is a developer only commands ⛔",
			member,
			EMBEDTYPE.ERROR,
		);
		await mika.interaction.replyEmbed(interaction, embed);
		return;
	}
	data.member = member;
	await next();
};

export { IsOwner };
