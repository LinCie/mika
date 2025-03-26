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
    .setName('seek')
    .setDescription('Change the position of current track')
    .addNumberOption((option) =>
        option
            .setName('position')
            .setDescription('The position of the music (in seconds)')
            .setRequired(true)
    )

class Shuffle extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
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
        const position = interaction.options.getNumber('position', true)

        const current = player.queue.getCurrent()
        const positionInSeconds = position * 1000

        if (
            positionInSeconds > (current?.info.length || 0) ||
            positionInSeconds < 0
        ) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ Music position is out of range ⛔',
                member,
                EMBEDTYPE.ERROR
            )

            await client.interaction.replyEmbed(interaction, embed)
            return
        }

        await player.seekMusic(positionInSeconds)
        const embed = client.embed.createMessageEmbedWithAuthor(
            `🎶 Music position has been changed to **${position}** seconds 🎶`,
            member,
            EMBEDTYPE.SUCCESS
        )
        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Shuffle
