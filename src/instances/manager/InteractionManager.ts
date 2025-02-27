import type {
    ActionRowBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    MessageCreateOptions,
    MessagePayloadOption,
    TextChannel,
} from 'discord.js'

class InteractionManager {
    public replyEmbedWithButton(
        interaction: ChatInputCommandInteraction | ButtonInteraction,
        embed: EmbedBuilder,
        buttons: ActionRowBuilder<MessageActionRowComponentBuilder>,
        options?: MessagePayloadOption | MessageCreateOptions
    ) {
        if (interaction.isButton()) {
            return interaction.update({
                components: [buttons],
                embeds: [embed],
                options,
            })
        }
        return interaction.editReply({
            components: [buttons],
            embeds: [embed],
            options,
        })
    }

    public replyEmbed(
        interaction: ChatInputCommandInteraction,
        embed: EmbedBuilder,
        options?: MessagePayloadOption | MessageCreateOptions
    ) {
        return interaction.editReply({
            embeds: [embed],
            options,
        })
    }

    public sendEmbed(
        channel: TextChannel,
        embed: EmbedBuilder,
        options?: MessagePayloadOption | MessageCreateOptions
    ) {
        return channel.send({ embeds: [embed], options })
    }
}

export { InteractionManager }
