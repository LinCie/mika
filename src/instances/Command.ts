import type {
    CommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js'
import type { Mika } from './Mika'

type Middleware<TContext = unknown> = (
    client: Mika,
    interaction: CommandInteraction,
    next: () => Promise<void>,
    context: TContext
) => Promise<void>

abstract class Command {
    public readonly data: RESTPostAPIChatInputApplicationCommandsJSONBody
    public isGuildOnly: boolean = false
    private middlewares: Middleware[] = []

    constructor(data: RESTPostAPIChatInputApplicationCommandsJSONBody) {
        this.data = data
    }

    abstract command(
        client: Mika,
        interaction: CommandInteraction,
        context: unknown
    ): Promise<void>

    async execute(client: Mika, interaction: CommandInteraction) {
        const context: unknown = {}
        let index = -1
        const dispatch = async (i: number): Promise<void> => {
            if (i <= index) {
                throw new Error('next() called multiple times')
            }
            index = i
            let fn:
                | Middleware
                | ((
                      client: Mika,
                      interaction: CommandInteraction,
                      context: unknown
                  ) => Promise<void>)
            if (i === this.middlewares.length) {
                fn = async (_client, _interaction, _next, ctx) => {
                    await this.command(client, interaction, ctx)
                }
            } else {
                fn = this.middlewares[i]
            }
            await fn(
                client,
                interaction,
                async () => {
                    await dispatch(i + 1)
                },
                context
            )
        }

        await dispatch(0)
    }

    use(...middleware: Middleware[]) {
        middleware.forEach((m) => this.middlewares.push(m))
    }
}

export { Command }
export type { Middleware }
