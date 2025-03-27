import { LOGGER_CHANNEL_ID } from '@/config'
import { ClientEvent, Mika } from '@/instances'
import { Events, TextChannel } from 'discord.js'

class InteractionCreateEvent extends ClientEvent {
    constructor(client: Mika) {
        super(client)
    }

    register(): void {
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return

            const command = this.client.commands.get(interaction.commandName)
            if (!command) {
                throw new Error(
                    `There is no command with name ${interaction.commandName}`
                )
            }

            try {
                await command.execute(this.client, interaction)
            } finally {
                const loggerEmbed =
                    this.client.embed.createSuccessLoggerEmbed(interaction)
                const loggerChannel = this.client.channels.cache.get(
                    LOGGER_CHANNEL_ID
                ) as TextChannel
                await this.client.interaction.sendEmbed(
                    loggerChannel,
                    loggerEmbed
                )
            }
        })

        return
    }
}

export default InteractionCreateEvent
