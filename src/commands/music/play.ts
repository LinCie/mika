import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Command, EMBEDTYPE, Mika, PlayerManager } from '@/instances'
import {
    IsInVoiceChannel,
    IsNotMaintenance,
    IsPlayerCurrent,
    IsPlayerInit,
} from '@/middlewares'

const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a music')
    .addStringOption((option) =>
        option
            .setName('query')
            .setDescription('The search query. Could be name or URL')
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('source')
            .setDescription('The search source. Defaults to YouTube Music')
            .setRequired(false)
            .addChoices(
                { name: 'Youtube Music', value: 'ytmsearch' },
                { name: 'Youtube', value: 'ytsearch' },
                { name: 'Spotify', value: 'spsearch' },
                { name: 'Soundcloud', value: 'scsearch' }
            )
    )

class Play extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
        this.use(
            IsNotMaintenance,
            IsInVoiceChannel,
            IsPlayerInit,
            IsPlayerCurrent
        )
    }

    async command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: { player: PlayerManager; member: GuildMember }
    ) {
        const { player, member } = context

        const query = interaction.options.getString('query', true)
        const source = interaction.options.getString('source') || 'ytmsearch'

        try {
            await player.addMusic(query, source, interaction)
        } catch (error) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ There is an error while trying to play music ⛔',
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed)
            throw error
        }
    }
}

export default Play
