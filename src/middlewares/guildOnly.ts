import type { Middleware } from '@/instances'

const GuildOnly: Middleware = async (_client, interaction, next) => {
    if (!interaction.guild) {
        interaction.reply('DM commands are not allowed')
        return
    }
    await next()
}

export { GuildOnly }
