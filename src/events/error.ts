import { ERROR_LOGGER_CHANNEL_ID } from '@/config'
import { ClientEvent, Mika } from '@/instances'
import { Events, TextChannel } from 'discord.js'

class ErrorEvent extends ClientEvent {
    constructor(client: Mika) {
        super(client)
    }

    register(): void {
        this.client.on(Events.Error, async (error) => {
            this.client.logger.error(error)

            const errorEmbed = this.client.embed.createErrorLoggerEmbed(error)
            const errorLoggerChannel = this.client.channels.cache.get(
                ERROR_LOGGER_CHANNEL_ID
            ) as TextChannel
            await this.client.interaction.sendEmbed(
                errorLoggerChannel,
                errorEmbed
            )
        })

        return
    }
}

export default ErrorEvent
