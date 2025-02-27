import {
    ActivityType,
    ApplicationCommandOptionType,
    Client,
    Collection,
    Events,
    REST,
    Routes,
    TextChannel,
    type ClientOptions,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js'
import { pathToFileURL } from 'bun'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import type { BaseLogger } from 'pino'
import { Connectors, Shoukaku } from 'shoukaku'
import { logger } from '@/utilities'
import {
    BOT_TOKEN,
    CLIENT_ID,
    ERROR_LOGGER_CHANNEL_ID,
    getNodes,
    GUILD_ID,
    LOGGER_CHANNEL_ID,
    NODE_ENV,
} from '@/config'
import {
    EmbedManager,
    InteractionManager,
    PlayerManager,
    PlaylistManager,
    Command,
    type Middleware,
} from '@/instances'
import { prisma } from '@/database'
import { DeferReply, GuildOnly } from '@/middlewares'

class Mika extends Client {
    public readonly logger: BaseLogger
    public readonly shoukaku: Shoukaku
    public readonly embed: EmbedManager
    public readonly interaction: InteractionManager
    public readonly players: Collection<string, PlayerManager>
    public readonly playlist: PlaylistManager
    public readonly globalMiddlewares: Middleware[]
    public readonly prisma = prisma
    private commands: Collection<string, Command> = new Collection()

    constructor(options: ClientOptions) {
        super(options)

        // Logger
        this.logger = logger

        // Player
        this.players = new Collection<string, PlayerManager>()

        // Embed
        this.embed = new EmbedManager()

        // Interaction
        this.interaction = new InteractionManager()

        // Playlist
        this.playlist = new PlaylistManager(this)

        // Client events
        this.clientEventHandler()

        // Shoukaku
        this.shoukaku = new Shoukaku(
            new Connectors.DiscordJS(this),
            getNodes(),
            {
                resumeTimeout: 30,
                resume: true,
                resumeByLibrary: true,
                moveOnDisconnect: true,
                reconnectTries: 10,
                reconnectInterval: 10,
            }
        )
        this.shoukaku
            .on('ready', (name) =>
                this.logger.info(`Lavalink node ${name} is now ready 🩷`)
            )
            .on('disconnect', (name) =>
                this.logger.warn(`Lavalink node ${name} has been disconnected`)
            )
            .on('reconnecting', (name, left) =>
                this.logger.warn(
                    `Lavalink node ${name} is attempting to reconnect\n${left} ${
                        left < 2 ? 'try' : 'tries'
                    } left`
                )
            )
            .on('debug', (name, content) => {
                if (NODE_ENV === 'debug') {
                    this.logger.debug(content, name)
                }
            })
            .on('error', (name, error) => this.logger.error(error, name))

        // Global middlewares
        this.globalMiddlewares = [GuildOnly, DeferReply]
    }

    private clientEventHandler() {
        this.once(Events.ClientReady, async () => {
            await this.registerCommands()

            // Presence
            this.user?.setPresence({
                activities: [
                    {
                        name: '/play',
                        type: ActivityType.Listening,
                    },
                ],
                status: 'online',
            })

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

            try {
                await command.execute(this, interaction)
            } finally {
                const loggerEmbed =
                    this.embed.createSuccessLogerEmbed(interaction)
                const loggerChannel = this.channels.cache.get(
                    LOGGER_CHANNEL_ID
                ) as TextChannel
                await this.interaction.sendEmbed(loggerChannel, loggerEmbed)
            }
        })

        this.on(Events.Error, async (error) => {
            this.logger.error(error.message, error)

            const errorEmbed = this.embed.createErrorLoggerEmbed(error)
            const errorLoggerChannel = this.channels.cache.get(
                ERROR_LOGGER_CHANNEL_ID
            ) as TextChannel
            await this.interaction.sendEmbed(errorLoggerChannel, errorEmbed)
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
                    instance.use(...this.globalMiddlewares)
                    this.commands.set(instance.data.name, instance)
                }
            }
        }

        // Start registering command
        const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
        const devCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
            []

        for (const command of this.commands.values()) {
            if (command.isGuildOnly) {
                devCommands.push(command.data.toJSON())
            } else {
                commands.push(command.data.toJSON())
            }
        }

        this.logger.info(
            `Started refreshing ${commands.length} application (/) commands.`
        )

        const rest = new REST().setToken(BOT_TOKEN)

        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: devCommands,
        })

        for (const command of devCommands) {
            this.logger.info(`Loaded dev command /${command.name}`)
        }

        await rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: commands,
        })

        for (const command of commands) {
            this.logger.info(
                `Loaded global command /${command.name} ${command.options
                    ?.filter(
                        (option) =>
                            option.type ===
                            ApplicationCommandOptionType.Subcommand
                    )
                    .map((option) => option.name)
                    .join(', ')}`
            )
        }
    }
}

export { Mika }
