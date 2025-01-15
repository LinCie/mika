import type {
	CommandInteraction,
	EmbedBuilder,
	Message,
	MessageCreateOptions,
	MessagePayloadOption,
	TextChannel,
} from "discord.js";

class InteractionManager {
	public replyEmbed(
		interaction: CommandInteraction,
		embed: EmbedBuilder,
		options?: MessagePayloadOption | MessageCreateOptions,
	): Promise<Message<boolean>> {
		return interaction.editReply({
			embeds: [embed],
			options,
		});
	}

	public sendEmbed(
		channel: TextChannel,
		embed: EmbedBuilder,
		options?: MessagePayloadOption | MessageCreateOptions,
	): Promise<Message<boolean>> {
		return channel.send({ embeds: [embed], options });
	}
}

export { InteractionManager };
