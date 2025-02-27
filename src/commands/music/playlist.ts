import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Command, Mika } from '@/instances'
import PlaylistCreate from './playlist/create'
import PlaylistPlay from './playlist/play'

const data = new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Playlist Manager')

class PlaylistCommand extends Command {
    private readonly playlistCreate = new PlaylistCreate()
    private readonly playlistPlay = new PlaylistPlay()

    constructor() {
        super(data)

        this.playlistCreate.configure(this.data)
        this.playlistPlay.configure(this.data)
    }

    async command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: unknown
    ) {
        const subcommand = interaction.options.getSubcommand()

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
