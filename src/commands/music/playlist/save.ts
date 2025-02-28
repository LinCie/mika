import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import type { Track } from 'shoukaku'
import { Prisma } from '@prisma/client'
import { EMBEDTYPE, Mika, PlayerManager, Subcommand } from '@/instances'
import { IsPlayerExist } from '@/middlewares'

class PlaylistSave extends Subcommand {
    constructor() {
        super()
        this.use(IsPlayerExist)
    }

    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand
                .setName('save')
                .setDescription('save current queue to playlist')
                .addStringOption((option) =>
                    option
                        .setName('name')
                        .setDescription('The playlist name')
                        .setRequired(true)
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

        try {
            const playlist = await client.playlist.getPlaylistByName(name)

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

            const musics: Track[] = (
                JSON.parse(playlist.musics) as Track[]
            ).concat(player.queue.getTracks())

            await client.playlist.addTrackToPlaylist(playlist.id, {
                ...playlist,
                musics: JSON.stringify(musics),
            })

            const embed = client.embed.createMessageEmbedWithAuthor(
                `🎶 Queue has been added to playlist **${playlist.name}** 🎶`,
                member,
                EMBEDTYPE.SUCCESS
            )
            await client.interaction.replyEmbed(interaction, embed)
        } catch (error) {
            let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
                `⛔ There is an error while trying to add queue to playlist **${name}** ⛔`,
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

export default PlaylistSave
