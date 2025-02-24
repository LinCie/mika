import type { Middleware } from '@/instances'

const DeferReply: Middleware = async (_client, interaction, next) => {
    await interaction.deferReply()
    await next()
}

export { DeferReply }
