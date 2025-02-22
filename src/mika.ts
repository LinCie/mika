import { GatewayIntentBits } from 'discord.js'
import { Mika } from './instances/Mika'
import { BOT_TOKEN } from './config'

const mika = new Mika({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildVoiceStates,
    ],
})

mika.login(BOT_TOKEN)
