import type {
	ActionRowBuilder,
	ButtonInteraction,
	CommandInteraction,
	EmbedBuilder,
	InteractionResponse,
	Message,
	MessageActionRowComponentBuilder,
	MessageCreateOptions,
	MessagePayloadOption,
	TextChannel,
} from "discord.js";

class InteractionManager {
	public replyEmbedWithButton(
		interaction: CommandInteraction | ButtonInteraction,
		embed: EmbedBuilder,
		buttons: ActionRowBuilder<MessageActionRowComponentBuilder>,
		options?: MessagePayloadOption | MessageCreateOptions,
	): Promise<Message<boolean>> | Promise<InteractionResponse<boolean>> {
		if (interaction.isButton()) {
			return interaction.update({
				components: [buttons],
				embeds: [embed],
				options,
			});
		}
		return interaction.editReply({
			components: [buttons],
			embeds: [embed],
			options,
		});
	}

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
