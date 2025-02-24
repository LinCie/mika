import type { GuildMember } from 'discord.js'
import { OWNER_ID } from '@/config'
import { EMBEDTYPE, type Middleware } from '@/instances'

const IsOwner: Middleware<{ member: GuildMember }> = async (
    client,
    interaction,
    next,
    context
) => {
    const member = context.member || (interaction.member as GuildMember)
    if (interaction.user.id !== OWNER_ID) {
        const embed = client.embed.createMessageEmbedWithAuthor(
            '⛔ This is a developer only commands ⛔',
            member,
            EMBEDTYPE.ERROR
        )
        await client.interaction.replyEmbed(interaction, embed)
        return
    }
    context.member = member
    await next()
}

export { IsOwner }
