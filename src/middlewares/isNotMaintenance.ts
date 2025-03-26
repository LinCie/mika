import { EMBEDTYPE, type Middleware } from '@/instances'
import type { GuildMember } from 'discord.js'

const IsNotMaintenance: Middleware<{ member: GuildMember }> = async (
    client,
    interaction,
    next,
    context
) => {
    const member = context.member || (interaction.member as GuildMember)
    if (client.maintenance) {
        const embed = client.embed.createMessageEmbedWithAuthor(
            '⚠️ **Mika** is currently in maintenance mode. This command is not available',
            member,
            EMBEDTYPE.WARNING
        )
        await client.interaction.replyEmbed(interaction, embed)
        return
    }
    context.member = member
    await next()
}

export { IsNotMaintenance }
