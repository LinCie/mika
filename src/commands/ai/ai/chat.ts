import type {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'

class AIChat extends Subcommand {
    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand
                .setName('chat')
                .setDescription('Send a chat to the AI')
                .addStringOption((option) =>
                    option
                        .setName('prompt')
                        .setDescription('Your message prompt')
                        .setRequired(true)
                )
        )
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember

        const prompt = interaction.options.getString('prompt', true)

        let fullText = ''
        let lastUpdateLength = 0
        const updateInterval = 100

        const embed = client.embed.createMessageEmbedWithAuthor(
            'Generating...',
            member,
            EMBEDTYPE.SUCCESS
        )

        await client.interaction.replyEmbed(interaction, embed)

        try {
            const stream = client.ai.openaiSendMessageStream(member.id, prompt)

            for await (const chunk of stream) {
                fullText += chunk

                if (fullText.length - lastUpdateLength >= updateInterval) {
                    embed.setDescription(fullText)
                    await interaction.editReply({ embeds: [embed] })
                    lastUpdateLength = fullText.length
                }
            }

            embed.setDescription(fullText)
            await interaction.editReply({ embeds: [embed] })
        } catch (error) {
            client.logger.error(error)
            embed.setDescription(
                'I am sorry, but I was unable to process your request.'
            )
            await interaction.editReply({ embeds: [embed] })
        }
    }
}

export default AIChat
