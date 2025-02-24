import {
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Command, EMBEDTYPE, Mika, PlayerManager } from '@/instances'
import {
    DeferReply,
    GuildOnly,
    IsInVoiceChannel,
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
            .setName('method')
            .setDescription('The search method. Defaults to soundcloud')
            .setRequired(false)
            .addChoices(
                { name: 'Soundcloud', value: 'scsearch' },
                { name: 'Youtube Music', value: 'ytmsearch' },
                { name: 'Youtube', value: 'ytsearch' },
                { name: 'Spotify', value: 'spsearch' }
            )
    )
    .toJSON()

class Play extends Command {
    constructor() {
        super(data)
        this.use(
            GuildOnly,
            DeferReply,
            IsInVoiceChannel,
            IsPlayerInit,
            IsPlayerCurrent
        )
    }

    async command(
        client: Mika,
        interaction: CommandInteraction,
        context: { player: PlayerManager; member: GuildMember }
    ) {
        const { player, member } = context

        const query = this.get<string>('query', interaction)
        const method =
            this.get<string | undefined>('method', interaction) || 'scsearch'

        try {
            await player.addMusic(query, method, interaction)
        } catch (error) {
            client.logger.error(error)
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ There is an error while trying to play music ⛔',
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed)
        }
    }
}

export default Play
