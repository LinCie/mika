import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Command, Mika } from '@/instances'
import PlaylistCreate from './playlist/create'
import PlaylistPlay from './playlist/play'
import PlaylistAdd from './playlist/add'
import PlaylistDelete from './playlist/delete'
import PlaylistRemove from './playlist/remove'
import PlaylistGet from './playlist/get'
import PlaylistList from './playlist/list'

const data = new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Playlist Manager')

class PlaylistCommand extends Command {
    private readonly playlistCreate = new PlaylistCreate()
    private readonly playlistPlay = new PlaylistPlay()
    private readonly playlistAdd = new PlaylistAdd()
    private readonly playlistDelete = new PlaylistDelete()
    private readonly playlistRemove = new PlaylistRemove()
    private readonly playlistGet = new PlaylistGet()
    private readonly playlistList = new PlaylistList()

    constructor() {
        super(data)

        this.playlistCreate.configure(this.data)
        this.playlistPlay.configure(this.data)
        this.playlistAdd.configure(this.data)
        this.playlistDelete.configure(this.data)
        this.playlistRemove.configure(this.data)
        this.playlistGet.configure(this.data)
        this.playlistGet.configure(this.data)
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
            case 'add':
                await this.playlistAdd.execute(client, interaction, context)
                break
            case 'delete':
                await this.playlistDelete.execute(client, interaction, context)
                break
            case 'remove':
                await this.playlistRemove.execute(client, interaction, context)
                break
            case 'get':
                await this.playlistGet.execute(client, interaction, context)
                break
            case 'list':
                await this.playlistList.execute(client, interaction, context)
                break
            default:
                throw new Error(`Subcommand ${subcommand} not found`)
        }
    }
}

export default PlaylistCommand
