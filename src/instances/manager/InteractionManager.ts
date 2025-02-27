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
import type { Mika } from '../Mika'

class InteractionManager {
    private readonly client: Mika

    constructor(client: Mika) {
        this.client = client
    }

    public replyEmbedWithButton(
        interaction: ChatInputCommandInteraction | ButtonInteraction,
        embed: EmbedBuilder,
        buttons: ActionRowBuilder<MessageActionRowComponentBuilder>,
        options?: MessagePayloadOption | MessageCreateOptions
    ) {
        try {
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
        } catch (error) {
            this.client.logger.error(error)
            throw error
        }
    }

    public replyEmbed(
        interaction: ChatInputCommandInteraction,
        embed: EmbedBuilder,
        options?: MessagePayloadOption | MessageCreateOptions
    ) {
        try {
            return interaction.editReply({
                embeds: [embed],
                options,
            })
        } catch (error) {
            this.client.logger.error(error)
            throw error
        }
    }

    public sendEmbed(
        channel: TextChannel,
        embed: EmbedBuilder,
        options?: MessagePayloadOption | MessageCreateOptions
    ) {
        try {
            return channel.send({ embeds: [embed], options })
        } catch (error) {
            this.client.logger.error(error)
            throw error
        }
    }
}

export { InteractionManager }
