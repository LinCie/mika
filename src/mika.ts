import { GatewayIntentBits } from 'discord.js'
import { Mika } from './instances/Mika'
import { BOT_TOKEN, getNodes, waitForLavalinkNodes } from './config'
import { logger } from './utilities'

const lavalinkNodes = getNodes()

if (lavalinkNodes.length > 0) {
    logger.info(
        `Waiting for Lavalink nodes to become ready: ${lavalinkNodes
            .map((node) => node.name)
            .join(', ')}`
    )

    await waitForLavalinkNodes(lavalinkNodes)

    logger.info(
        `Lavalink nodes are ready: ${lavalinkNodes
            .map((node) => node.name)
            .join(', ')}`
    )
}

const mika = new Mika(
    {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildExpressions,
            GatewayIntentBits.GuildVoiceStates,
        ],
    },
    lavalinkNodes
)

await mika.login(BOT_TOKEN)
