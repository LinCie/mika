import {
    GuildMember,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { EMBEDTYPE, Command, type Mika } from '@/instances'

const data = new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with Mika')
    .addStringOption((option) =>
        option
            .setName('prompt')
            .setDescription('Your message prompt')
            .setRequired(true)
    )

class Chat extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
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

export default Chat
