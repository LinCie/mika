import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { Command, type Mika } from '@/instances'
import AIChat from './ai/chat'
import AIClear from './ai/clear'
import AIPersonality from './ai/personality'

const data = new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Chat with AI')

class Chat extends Command {
    private readonly aiChat = new AIChat()
    private readonly aiClear = new AIClear()
    private readonly aiPersonality = new AIPersonality()

    constructor() {
        super(data)

        this.aiChat.configure(this.data)
        this.aiClear.configure(this.data)
        this.aiPersonality.configure(this.data)
    }

    async command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: unknown
    ) {
        const subcommand = interaction.options.getSubcommand()

        switch (subcommand) {
            case 'chat':
                this.aiChat.execute(client, interaction, context)
                break

            case 'clear':
                this.aiClear.execute(client, interaction, context)
                break

            case 'personality':
                this.aiPersonality.execute(client, interaction, context)
                break

            default:
                throw new Error(`Subcommand ${subcommand} not found`)
        }
    }
}

export default Chat
