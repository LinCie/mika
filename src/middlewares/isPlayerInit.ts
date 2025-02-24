import { PlayerManager, type Middleware } from '@/instances'

const IsPlayerInit: Middleware<{ player?: PlayerManager }> = async (
    client,
    interaction,
    next,
    context
) => {
    const player =
        context.player ||
        client.players.get(interaction.guild?.id || '') ||
        (await new PlayerManager(client, interaction).init(interaction))

    context.player = player
    await next()
}

export { IsPlayerInit }
