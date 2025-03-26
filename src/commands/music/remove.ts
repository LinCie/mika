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
    .setName('remove')
    .setDescription('Remove track from queue')
    .addNumberOption((option) =>
        option
            .setName('position')
            .setDescription('The position of removed track')
            .setRequired(true)
    )

class Remove extends Command {
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

        if (position > player.queue.getLength() || position < 0) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ Removed position is out of range ⛔',
                member,
                EMBEDTYPE.ERROR
            )

            await client.interaction.replyEmbed(interaction, embed, {
                ephemeral: true,
            })
            return
        }

        const removedTrack = player.queue.getTrack(position - 1)
        player.queue.removeTrack(position - 1)

        const embed = client.embed.createMessageEmbedWithAuthor(
            `🎶 **${removedTrack?.info.title}** has been sucessfully removed 🎶`,
            member,
            EMBEDTYPE.SUCCESS
        )

        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Remove
