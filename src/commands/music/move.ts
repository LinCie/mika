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
    .setName('move')
    .setDescription('Move to specified track position')
    .addNumberOption((option) =>
        option
            .setName('position')
            .setDescription('The position of the track')
            .setRequired(true)
    )

class Move extends Command {
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

        const index = position - 1
        const track = player.queue.getTrack(index)

        if (position < 0 || position > player.queue.getLength()) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ Track position is out of range ⛔',
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed, {
                ephemeral: true,
            })
            return
        }

        await player.moveTrack(index)

        const embed = client.embed.createMessageEmbedWithAuthor(
            `🎶 Player has been successfully moved to **${track?.info.title}** 🎶`,
            member,
            EMBEDTYPE.SUCCESS
        )
        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Move
