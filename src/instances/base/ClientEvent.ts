import type { Mika } from '@/instances'

abstract class ClientEvent {
    public readonly client: Mika

    constructor(client: Mika) {
        this.client = client
    }

    abstract register(): void
}

export { ClientEvent }
