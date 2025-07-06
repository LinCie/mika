import type {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'
import type { Mika } from '../Mika'

type Middleware<TContext = unknown> = (
    client: Mika,
    interaction: ChatInputCommandInteraction,
    next: () => Promise<void>,
    context: TContext
) => Promise<void>

abstract class Command {
    public data: SlashCommandBuilder
    public category: string // Added category property
    public isGuildOnly: boolean = false
    private middlewares: Middleware[] = []

    constructor(data: SlashCommandBuilder, category: string = 'General') { // Added category to constructor
        this.data = data
        this.category = category
    }

    abstract command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: unknown
    ): Promise<void>

    async execute(client: Mika, interaction: ChatInputCommandInteraction) {
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
                      interaction: ChatInputCommandInteraction,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    use(...middleware: Middleware<any>[]) {
        middleware.forEach((m) => this.middlewares.push(m))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useGlobal(...middleware: Middleware<any>[]) {
        middleware.forEach((m) => this.middlewares.unshift(m))
    }
}

export { Command }
export type { Middleware }
