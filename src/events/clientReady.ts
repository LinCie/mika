import { ClientEvent, Mika } from '@/instances'
import { ActivityType, Events } from 'discord.js'

class ClientReadyEvent extends ClientEvent {
    constructor(client: Mika) {
        super(client)
    }

    register(): void {
        this.client.on(Events.ClientReady, async () => {
            // Presence
            this.client.user?.setPresence({
                activities: [
                    {
                        name: '/play',
                        type: ActivityType.Listening,
                    },
                ],
                status: 'online',
            })

            this.client.logger.info('Mika is now ready 🩷')
        })

        return
    }
}

export default ClientReadyEvent
