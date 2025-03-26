import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Command, EMBEDTYPE, LOOPSTATE, Mika, PlayerManager } from '@/instances'
import {
    IsInVoiceChannel,
    IsNotMaintenance,
    IsPlayerCurrent,
    IsPlayerExist,
} from '@/middlewares'

const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip current track')

class Skip extends Command {
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
        const current = player.queue.getCurrent()!

        if (
            !player.queue.getNext() &&
            player.loopState === LOOPSTATE.LoopingNone
        ) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ There is no more track in queue ⛔',
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed, {
                ephemeral: true,
            })
            return
        }

        await player.skipMusic()

        const embed = client.embed.createMessageEmbedWithAuthor(
            `🎶 **${current.info.title}** has been sucessfully skipped 🎶`,
            member,
            EMBEDTYPE.SUCCESS
        )
        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Skip
