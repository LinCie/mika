import type { Mika } from "@/instances";
import type { CommandInteraction, GuildMember } from "discord.js";
import type { GuardFunction } from "discordx";

const IsInVoiceChannel: GuardFunction<CommandInteraction> = async (
	interaction,
	client,
	next,
	data: { member: GuildMember },
) => {
	const mika = client as Mika;
	const member = data.member || (interaction.member as GuildMember);

	if (!member.voice.channel) {
		await mika.sendMessageEmbed(
			interaction,
			member,
			"You're currently not in a voice channel!",
		);
		return;
	}

	data.member = member;
	await next();
	return;
};

export { IsInVoiceChannel };
