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
    .setName('loop')
    .setDescription('Loop queue')
    .addStringOption((option) =>
        option
            .setName('method')
            .setDescription('The looping method. Defaults to current')
            .addChoices(
                { name: 'Off', value: LOOPSTATE.LoopingNone },
                { name: 'Current', value: LOOPSTATE.LoopingCurrent },
                { name: 'Queue', value: LOOPSTATE.LoopingQueue }
            )
    )

class Loop extends Command {
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
        const method =
            (interaction.options.getString('method') as LOOPSTATE) ||
            LOOPSTATE.LoopingCurrent

        if (player.loopState === method) {
            player.loopState = LOOPSTATE.LoopingNone
        } else {
            player.loopState = method
        }

        switch (player.loopState) {
            case LOOPSTATE.LoopingNone: {
                const embed = client.embed.createMessageEmbedWithAuthor(
                    '🎶 Loop is now off 🎶',
                    member,
                    EMBEDTYPE.SUCCESS
                )
                await client.interaction.replyEmbed(interaction, embed)
                break
            }

            case LOOPSTATE.LoopingCurrent: {
                const current = player.queue.getCurrent()!
                const embed = client.embed.createMessageEmbedWithAuthor(
                    `🎶 Mika is looping **${current.info.title}** now 🎶`,
                    member,
                    EMBEDTYPE.SUCCESS
                )
                await client.interaction.replyEmbed(interaction, embed)
                break
            }

            case LOOPSTATE.LoopingQueue: {
                const embed = client.embed.createMessageEmbedWithAuthor(
                    '🎶 Mika is looping queue now 🎶',
                    member,
                    EMBEDTYPE.SUCCESS
                )
                await client.interaction.replyEmbed(interaction, embed)
                break
            }
        }
    }
}

export default Loop
