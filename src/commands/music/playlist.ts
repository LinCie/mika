import {
    CommandInteraction,
    CommandInteractionOptionResolver,
    SlashCommandBuilder,
} from 'discord.js'
import { Command, Mika } from '@/instances'
import PlaylistCreate from './playlist/create'
import PlaylistPlay from './playlist/play'

class PlaylistCommand extends Command {
    private readonly playlistCreate = new PlaylistCreate()
    private readonly playlistPlay = new PlaylistPlay()

    constructor() {
        const data = new SlashCommandBuilder()
            .setName('playlist')
            .setDescription('Playlist Manager')

        super(data.toJSON())

        this.playlistCreate.configure(data)
        this.playlistPlay.configure(data)

        this.data = data.toJSON()
    }

    async command(
        client: Mika,
        interaction: CommandInteraction,
        context: unknown
    ) {
        const options = interaction.options as CommandInteractionOptionResolver
        const subcommand = options.getSubcommand()

        switch (subcommand) {
            case 'create':
                await this.playlistCreate.execute(client, interaction, context)
                break
            case 'play':
                await this.playlistPlay.execute(client, interaction, context)
                break
            default:
                throw new Error(`Subcommand ${subcommand} not found`)
        }
    }
}

export default PlaylistCommand
