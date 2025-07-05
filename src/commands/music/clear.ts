import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Command, EMBEDTYPE, Mika, PlayerManager } from '@/instances'
import {
    IsInVoiceChannel,
    IsNotMaintenance,
    IsPlayerCurrent,
    IsPlayerExist,
} from '@/middlewares'

const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears the music queue')

class Clear extends Command {
    constructor() {
        super(data)
        this.use(
            IsNotMaintenance,
            IsInVoiceChannel,
            IsPlayerExist,
            IsPlayerCurrent
        )
    }

    async command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: { player: PlayerManager; member: GuildMember }
    ) {
        const { player, member } = context

        if (player.queue.getLength() <= 1) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ The queue is already empty ⛔',
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed, {
                ephemeral: true,
            })
            return
        }

        player.queue.clearQueue()

        const embed = client.embed.createMessageEmbedWithAuthor(
            '🎶 The queue has been cleared 🎶',
            member,
            EMBEDTYPE.SUCCESS
        )
        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Clear
