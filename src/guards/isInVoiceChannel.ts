import { GLOBAL_COLOR } from "@/config";
import type { Mika } from "@/instances";
import {
	CommandInteraction,
	EmbedBuilder,
	type TextChannel,
	type GuildMember,
} from "discord.js";
import { SimpleCommandMessage, type GuardFunction } from "discordx";

const IsInVoiceChannel: GuardFunction<
	SimpleCommandMessage | CommandInteraction
> = async (interaction, client, next) => {
	if (interaction instanceof CommandInteraction) {
		const member = interaction.member as GuildMember;
		const channel = client.channels.cache.get(
			interaction.channel?.id!,
		) as TextChannel;

		if (member.voice.channel) {
			await next();
		}

		const embed = new EmbedBuilder()
			.setColor(GLOBAL_COLOR)
			.setAuthor({
				name: member.displayName,
				iconURL: member.displayAvatarURL(),
			})
			.setDescription("You're currently not in a voice channel!");

		await interaction.deleteReply();
		await channel.send({ embeds: [embed], options: { ephemeral: true } });
	} else if (interaction instanceof SimpleCommandMessage) {
		const member = interaction.message.member;
		if (member?.voice.channel) {
			await next();
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(GLOBAL_COLOR)
			.setAuthor({
				name: member?.displayName!,
				iconURL: member?.displayAvatarURL(),
			})
			.setDescription("You're currently not in a voice channel!");

		interaction.message.reply({
			embeds: [embed],
			options: { ephemeral: true },
		});
	}
};

export { IsInVoiceChannel };
