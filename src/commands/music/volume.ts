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
    .setName('volume')
    .setDescription('Set the player volume')
    .addNumberOption((option) =>
        option
            .setName('volume')
            .setDescription('The volume you would like to change')
            .setRequired(true)
    )

class Volume extends Command {
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

        const volume = interaction.options.getNumber('volume', true)

        if (volume < 0) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ Volume should not be less than **0** ⛔',
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed)
            return
        }

        if (volume > 1000) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ Volume should not exceed **1000** ⛔',
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed)
            return
        }

        await player.changeVolume(volume)

        const embed = client.embed.createMessageEmbedWithAuthor(
            `🎶 Volume has been successfully changed to **${volume}** 🎶`,
            member,
            EMBEDTYPE.SUCCESS
        )
        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Volume
