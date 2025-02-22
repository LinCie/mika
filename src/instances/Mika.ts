import {
    Client,
    Collection,
    Events,
    REST,
    Routes,
    type ClientOptions,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js'
import { pathToFileURL } from 'bun'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import type { BaseLogger } from 'pino'
import { logger } from '@/utilities'
import { BOT_TOKEN, CLIENT_ID } from '@/config'
import { Command } from './Command'

class Mika extends Client {
    public readonly logger: BaseLogger
    private commands: Collection<string, Command> = new Collection()

    constructor(options: ClientOptions) {
        super(options)

        // Logger
        this.logger = logger

        // Client events
        this.clientEventHandler()
    }

    private clientEventHandler() {
        this.once(Events.ClientReady, async () => {
            await this.registerCommands()
            this.logger.info('Mika is now ready 🩷')
        })

        this.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return

            const command = this.commands.get(interaction.commandName)
            if (!command) {
                throw new Error(
                    `There is no command with name ${interaction.commandName}`
                )
            }

            await command.execute(this, interaction)
        })

        this.on(Events.Error, (error) => {
            this.logger.error(error.message, error)
        })
    }

    private async registerCommands() {
        for await (const file of glob('src/commands/**/*.ts', {})) {
            const filePath = pathToFileURL(path.resolve(file)).href
            const module = await import(filePath)
            const ClassRef = module.default

            if (ClassRef && typeof ClassRef === 'function') {
                const instance = new ClassRef()
                if (instance instanceof Command) {
                    this.commands.set(instance.data.name, instance)
                } else {
                    this.logger.warn('test')
                }
            }
        }

        try {
            const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
                []
            const devCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
                []

            this.commands.forEach((command) => {
                if (command.isGuildOnly) {
                    devCommands.push(command.data)
                } else {
                    commands.push(command.data)
                }
            })

            this.logger.info(
                `Started refreshing ${commands.length} application (/) commands.`
            )

            const rest = new REST().setToken(BOT_TOKEN)

            await rest.put(Routes.applicationCommands(CLIENT_ID), {
                body: commands,
            })

            commands.forEach((command) => {
                this.logger.info(`Loaded command /${command.name}`)
            })
        } catch (error) {
            this.logger.error(error)
        }
    }
}

export { Mika }
