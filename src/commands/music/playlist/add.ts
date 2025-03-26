import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { LoadType, type Track } from 'shoukaku'
import { Prisma } from '@prisma/client'
import { EMBEDTYPE, Mika, PlayerManager, Subcommand } from '@/instances'
import { IsNotMaintenance, IsPlayerExist } from '@/middlewares'

class PlaylistAdd extends Subcommand {
    constructor() {
        super()
        this.use(IsNotMaintenance, IsPlayerExist)
    }

    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand
                .setName('add')
                .setDescription('add track to playlist')
                .addStringOption((option) =>
                    option
                        .setName('name')
                        .setDescription('The playlist name')
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option.setName('url').setDescription('The track url')
                )
        )
    }

    async command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: { player: PlayerManager }
    ) {
        const member = interaction.member as GuildMember
        const { player } = context

        const name = interaction.options.getString('name', true)
        const url = interaction.options.getString('url', false)

        try {
            let music: Track | Track[] | undefined
            if (!url) {
                music = player.queue.getCurrent()
            } else {
                const result = await player.searchMusic(url, 'url')

                switch (result?.loadType) {
                    case LoadType.TRACK:
                        music = result.data
                        break
                    case LoadType.PLAYLIST:
                        music = result.data.tracks
                        break
                    default:
                        throw new Error('Invalid URL')
                }
            }

            const playlist = await client.playlist.getPlaylistByName(
                name.toLowerCase()
            )

            if (playlist.userId !== member.user.id) {
                const embed = client.embed.createMessageEmbedWithAuthor(
                    `⛔ You're not the owner of playlist **${name}** ⛔`,
                    member,
                    EMBEDTYPE.ERROR
                )
                await client.interaction.replyEmbed(interaction, embed, {
                    ephemeral: true,
                })
                return
            }

            if (!music) {
                throw new Error('Empty result')
            }

            const musics: Track[] = JSON.parse(playlist.musics)

            if (Array.isArray(music)) {
                for (const track of music) {
                    musics.push(track)
                }
            } else {
                musics.push(music)
            }

            await client.playlist.addTrackToPlaylist(playlist.id, {
                ...playlist,
                musics: JSON.stringify(musics),
            })

            if (Array.isArray(music)) {
                const embed = client.embed.createMessageEmbedWithAuthor(
                    `🎶 Musics has been added to playlist **${playlist.name}** 🎶`,
                    member,
                    EMBEDTYPE.SUCCESS
                )
                await client.interaction.replyEmbed(interaction, embed)
            } else {
                const embed = client.embed.createMessageEmbedWithAuthor(
                    `🎶 **${music.info.title}** has been added to playlist **${playlist.name}** 🎶`,
                    member,
                    EMBEDTYPE.SUCCESS
                )
                await client.interaction.replyEmbed(interaction, embed)
            }
        } catch (error) {
            let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
                `⛔ There is an error while trying to add music to playlist **${name}** ⛔`,
                member,
                EMBEDTYPE.ERROR
            )

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    embed = client.embed.createMessageEmbedWithAuthor(
                        `⛔ Playlist **${name}** doesn't exist ⛔`,
                        member,
                        EMBEDTYPE.ERROR
                    )
                }
            }

            await client.interaction.replyEmbed(interaction, embed, {
                ephemeral: true,
            })

            throw error
        }
    }
}

export default PlaylistAdd
