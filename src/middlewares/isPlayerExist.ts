import type { GuildMember } from 'discord.js'
import { EMBEDTYPE, type Middleware, type PlayerManager } from '@/instances'

const IsPlayerExist: Middleware<{
    member?: GuildMember
    player?: PlayerManager
}> = async (client, interaction, next, context) => {
    const member = context.member || (interaction.member as GuildMember)
    const player =
        context.player || client.players.get(interaction.guild?.id || '')

    if (!player) {
        const embed = client.embed.createMessageEmbedWithAuthor(
            '⛔ There is no active player in this server ⛔',
            member,
            EMBEDTYPE.ERROR
        )

        await client.interaction.replyEmbed(interaction, embed, {
            ephemeral: true,
        })
        return
    }

    context.member = member
    context.player = player
    await next()
}

export { IsPlayerExist }
