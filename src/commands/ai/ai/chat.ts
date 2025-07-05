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

        const response = await client.ai.sendMessage(member.id, prompt)

        const embed = client.embed.createMessageEmbedWithAuthor(
            response,
            member,
            EMBEDTYPE.SUCCESS
        )

        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default AIChat
