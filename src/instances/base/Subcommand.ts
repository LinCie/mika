import type {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'
import type { Mika } from '../Mika'

type SubcommandMiddleware<TContext = unknown> = (
    client: Mika,
    interaction: ChatInputCommandInteraction,
    next: () => Promise<void>,
    context: TContext
) => Promise<void>

abstract class Subcommand {
    public isGuildOnly: boolean = false
    private middlewares: SubcommandMiddleware[] = []

    abstract command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: unknown
    ): Promise<void>

    async execute(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        ctx: unknown
    ) {
        const context: unknown = ctx
        let index = -1
        const dispatch = async (i: number): Promise<void> => {
            if (i <= index) {
                throw new Error('next() called multiple times')
            }
            index = i
            let fn:
                | SubcommandMiddleware
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
    use(...middleware: SubcommandMiddleware<any>[]) {
        middleware.forEach((m) => this.middlewares.push(m))
    }

    abstract configure(data: SlashCommandBuilder): Promise<void>
}

export { Subcommand }
export type { SubcommandMiddleware }
