import {
    ActivityType,
    ApplicationCommandOptionType,
    Client,
    Collection,
    REST,
    Routes,
    type ClientOptions,
    type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js'
import { pathToFileURL } from 'bun'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import type { BaseLogger } from 'pino'
import { Connectors, Shoukaku } from 'shoukaku'
import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai'
import { logger } from '@/utilities'
import {
    BOT_TOKEN,
    CLIENT_ID,
    GEMINI_API_KEY,
    getNodes,
    GUILD_ID,
    NODE_ENV,
} from '@/config'
import {
    EmbedManager,
    InteractionManager,
    PlayerManager,
    PlaylistManager,
    Command,
    ClientEvent,
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
    public readonly ai: GenerativeModel
    public readonly prisma = prisma
    public maintenance: boolean = false
    public commands: Collection<string, Command> = new Collection()

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

        // AI
        this.ai = new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({
            model: 'gemini-1.5-flash',
        })

        // Register
        this.registerEvents()
        this.registerCommands()

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
        this.globalMiddlewares = [DeferReply, GuildOnly]
    }

    private async registerEvents() {
        this.logger.info('Started loading client events...')

        for await (const file of glob('src/events/**/*.ts', {})) {
            const filePath = pathToFileURL(path.resolve(file)).href
            const module = await import(filePath)
            const ClassRef = module.default

            if (ClassRef && typeof ClassRef === 'function') {
                const instance = new ClassRef(this)
                if (instance instanceof ClientEvent) {
                    instance.register()

                    const eventName = file.split('/').pop()?.split('.').shift()
                    this.logger.info(`Loaded client event ${eventName}`)
                }
            }
        }
    }

    private async registerCommands() {
        for await (const file of glob('src/commands/**/*.ts', {})) {
            const filePath = pathToFileURL(path.resolve(file)).href
            const module = await import(filePath)
            const ClassRef = module.default

            if (ClassRef && typeof ClassRef === 'function') {
                const instance = new ClassRef()
                if (instance instanceof Command) {
                    instance.useGlobal(...this.globalMiddlewares)
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
            `Started refreshing ${commands.length} application (/) commands...`
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

    public async maintenanceMode(maintenance: boolean) {
        this.maintenance = maintenance
        if (maintenance) {
            this.players.forEach(async (player) => {
                await player.stopPlayer()
            })
            this.user?.setPresence({
                activities: [
                    {
                        name: '⚠️ Maintenance Mode',
                        type: ActivityType.Custom,
                    },
                ],
                status: 'idle',
            })
        } else {
            this.user?.setPresence({
                activities: [
                    {
                        name: '/play',
                        type: ActivityType.Listening,
                    },
                ],
                status: 'online',
            })
        }
    }
}

export { Mika }
