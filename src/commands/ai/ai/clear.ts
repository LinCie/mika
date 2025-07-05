import type {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'

class AIClear extends Subcommand {
    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand.setName('clear').setDescription('Clear chat memory')
        )
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember
        const cleared = client.ai.clearChat(member.id)

        if (cleared) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                'Your chat history with me has been cleared, Sensei! We can start fresh now. ☆',
                member,
                EMBEDTYPE.SUCCESS
            )
            await client.interaction.replyEmbed(interaction, embed)
        } else {
            const embed = client.embed.createMessageEmbedWithAuthor(
                "It looks like we don't have any chat history, Sensei. Let's start a conversation! Use `/chat` to talk to me. ☆",
                member,
                EMBEDTYPE.GLOBAL
            )
            await client.interaction.replyEmbed(interaction, embed)
        }
    }
}

export default AIClear
