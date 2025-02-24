import type { GuildMember } from 'discord.js'
import { EMBEDTYPE, type Middleware } from '@/instances'

const IsInVoiceChannel: Middleware<{ member?: GuildMember }> = async (
    client,
    interaction,
    next,
    context
) => {
    const member = context.member || (interaction.member as GuildMember)

    if (!member.voice.channel) {
        const embed = client.embed.createMessageEmbedWithAuthor(
            "⛔ You're currently not in a voice channel! ⛔",
            member,
            EMBEDTYPE.ERROR
        )
        await client.interaction.replyEmbed(interaction, embed, {
            ephemeral: true,
        })
        return
    }

    context.member = member
    await next()
}

export { IsInVoiceChannel }
