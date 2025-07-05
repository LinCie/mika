import {
    GuildMember,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { EMBEDTYPE, Command, type Mika } from '@/instances'

interface CommandInfo {
    name: string
    description: string
    category: 'General' | 'Music' | 'Playlist' | 'AI'
    usage?: string
    subcommands?: {
        name: string
        description: string
        usage?: string
    }[]
}

// Store all command information here for easy access
const commands: CommandInfo[] = [
    // General Commands
    {
        name: 'help',
        description:
            'Shows a list of all commands or info about a specific command.',
        category: 'General',
        usage: '/help `[command]`',
    },
    {
        name: 'ping',
        description: 'Checks the bot\'s latency and replies with "Pong!".',
        category: 'General',
        usage: '/ping',
    },
    // Music Commands
    {
        name: 'play',
        description: 'Plays a song or adds it to the queue.',
        category: 'Music',
        usage: '/play `query:<song name or url>` `[source]`',
    },
    {
        name: 'search',
        description:
            'Searches for a song and lets you choose from the results.',
        category: 'Music',
        usage: '/search `query:<song name or url>` `[source]`',
    },
    {
        name: 'queue',
        description: 'Displays the current song queue with pagination.',
        category: 'Music',
        usage: '/queue',
    },
    {
        name: 'skip',
        description: 'Skips the currently playing track.',
        category: 'Music',
        usage: '/skip',
    },
    {
        name: 'stop',
        description:
            'Stops the music, clears the queue, and disconnects the bot.',
        category: 'Music',
        usage: '/stop',
    },
    {
        name: 'pause',
        description: 'Pauses the currently playing track.',
        category: 'Music',
        usage: '/pause',
    },
    {
        name: 'resume',
        description: 'Resumes the paused track.',
        category: 'Music',
        usage: '/resume',
    },
    {
        name: 'loop',
        description: 'Sets the loop mode for the queue (Off, Current, Queue).',
        category: 'Music',
        usage: '/loop `[method]`',
    },
    {
        name: 'shuffle',
        description: 'Shuffles the songs in the queue.',
        category: 'Music',
        usage: '/shuffle',
    },
    {
        name: 'move',
        description: 'Moves a track to a specific position in the queue.',
        category: 'Music',
        usage: '/move `position:<track number>`',
    },
    {
        name: 'remove',
        description: 'Removes a track from a specific position in the queue.',
        category: 'Music',
        usage: '/remove `position:<track number>`',
    },
    {
        name: 'seek',
        description: 'Seeks to a specific time in the current song.',
        category: 'Music',
        usage: '/seek `position:<time in seconds>`',
    },
    {
        name: 'volume',
        description: 'Changes the player volume (0-1000).',
        category: 'Music',
        usage: '/volume `volume:<number>`',
    },
    {
        name: 'download',
        description: 'Generates a download link for the current song.',
        category: 'Music',
        usage: '/download',
    },
    {
        name: 'clear',
        description: 'Clear current queue.',
        category: 'Music',
        usage: '/clear',
    },
    // AI Command
    {
        name: 'ai',
        description: 'Chat with AI',
        category: 'AI',
        usage: '/ai `<subcommand>`',
        subcommands: [
            {
                name: 'chat',
                description: 'Send a chat to AI',
                usage: '/ai `chat` `prompt:<your message prompt>`',
            },
            {
                name: 'clear',
                description: 'Clear the chat history',
                usage: '/ai `clear`',
            },
            {
                name: 'personality',
                description: 'Change the AI personality',
                usage: '/ai `personality` `personality:<personality name>`',
            },
        ],
    },

    // Playlist Command
    {
        name: 'playlist',
        description: 'The main command for managing your playlists.',
        category: 'Playlist',
        usage: '/playlist `<subcommand>`',
        subcommands: [
            {
                name: 'create',
                description: 'Creates a new, empty playlist.',
                usage: '/playlist `create` `name:<playlist name>`',
            },
            {
                name: 'delete',
                description: 'Deletes one of your playlists.',
                usage: '/playlist `delete` `name:<playlist name>`',
            },
            {
                name: 'add',
                description: 'Adds a track (or current song) to a playlist.',
                usage: '/playlist `add` `name:<playlist name>` `[url]`',
            },
            {
                name: 'remove',
                description: 'Removes a track from a playlist by its position.',
                usage: '/playlist `remove` `name:<playlist name>` `position:<track number>`',
            },
            {
                name: 'play',
                description: 'Adds all tracks from a playlist to the queue.',
                usage: '/playlist `play` `name:<playlist name>`',
            },
            {
                name: 'save',
                description:
                    'Saves the current queue to one of your playlists.',
                usage: '/playlist `save` `name:<playlist name>`',
            },
            {
                name: 'list',
                description: 'Lists all of your created playlists.',
                usage: '/playlist `list`',
            },
            {
                name: 'get',
                description: 'Shows all the tracks inside a specific playlist.',
                usage: '/playlist `get` `name:<playlist name>`',
            },
        ],
    },
]

// Create a map for quick lookups
const commandMap = new Map<string, CommandInfo>(
    commands.map((cmd) => [cmd.name, cmd])
)

const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription(
        'Get a list of all commands or info about a specific command.'
    )
    .addStringOption((option) => {
        option
            .setName('command')
            .setDescription('The command you want help with.')
            .setRequired(false)
        // Dynamically add choices from our command list
        commands.forEach((cmd) =>
            option.addChoices({ name: cmd.name, value: cmd.name })
        )
        return option
    })

class Help extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember
        const commandName = interaction.options.getString('command')

        if (commandName) {
            // User asked for help on a specific command
            const commandInfo = commandMap.get(commandName)

            if (!commandInfo) {
                const embed = client.embed.createMessageEmbedWithAuthor(
                    `⛔ The command \`${commandName}\` was not found.`,
                    member,
                    EMBEDTYPE.ERROR
                )
                await client.interaction.replyEmbed(interaction, embed, {
                    ephemeral: true,
                })
                return
            }

            const embed = client.embed
                .createMessageEmbedWithAuthor(
                    commandInfo.description,
                    member,
                    EMBEDTYPE.GLOBAL
                )
                .setTitle(`Command: /${commandInfo.name}`)

            if (commandInfo.usage) {
                embed.addFields({
                    name: 'Usage',
                    value: `\`${commandInfo.usage}\``,
                })
            }

            if (commandInfo.subcommands) {
                const subcommandsString = commandInfo.subcommands
                    .map((sub) => `> \`${sub.name}\` - ${sub.description}`)
                    .join('\n')
                embed.addFields({
                    name: 'Subcommands',
                    value: subcommandsString,
                })
                embed.setFooter({
                    text: 'For more details, use `/help` with the subcommand, e.g., `/help playlist create` (feature coming soon).',
                })
            }

            await client.interaction.replyEmbed(interaction, embed, {
                ephemeral: true,
            })
        } else {
            // User wants the main help menu
            const embed = client.embed
                .createMessageEmbedWithAuthor(
                    'Hello! Here are all the things I can do for you. \nUse `/help <command>` for more details on a specific command.',
                    member,
                    EMBEDTYPE.GLOBAL
                )
                .setTitle("Mika's Command List")

            const categories = ['General', 'Music', 'Playlist', 'AI']

            categories.forEach((category) => {
                const commandsInCategory = commands
                    .filter((cmd) => cmd.category === category)
                    .map((cmd) => `\`${cmd.name}\``)
                    .join(' ')

                if (commandsInCategory) {
                    embed.addFields({
                        name: `••• ${category} Commands •••`,
                        value: commandsInCategory,
                    })
                }
            })

            await client.interaction.replyEmbed(interaction, embed, {
                ephemeral: true,
            })
        }
    }
}

export default Help
