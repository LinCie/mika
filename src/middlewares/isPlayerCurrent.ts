import type { GuildMember } from 'discord.js'
import { EMBEDTYPE, type Middleware, type PlayerManager } from '@/instances'

const IsPlayerCurrent: Middleware<{
    member?: GuildMember
    player?: PlayerManager
}> = async (client, interaction, next, context) => {
    const member = context.member || (interaction.member as GuildMember)
    const player =
        context.player || client.players.get(interaction.guild?.id || '')

    if (player?.voice?.id !== member.voice.channel?.id) {
        const embed = client.embed.createMessageEmbedWithAuthor(
            "⛔ You're currently not in the same voice channel with the player ⛔",
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

export { IsPlayerCurrent }
