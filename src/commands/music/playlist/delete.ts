import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Prisma } from '@prisma/client'
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'
import { EMOJI } from '@/config'

class PlaylistDelete extends Subcommand {
    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand
                .setName('delete')
                .setDescription('delete a playlist')
                .addStringOption((option) =>
                    option
                        .setName('name')
                        .setDescription('The playlist name')
                        .setRequired(true)
                )
        )
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember

        const name = interaction.options.getString('name', true)

        try {
            const loadingEmbed = client.embed.createMessageEmbedWithAuthor(
                `${EMOJI.loading} Deleting your playlists...`,
                member,
                EMBEDTYPE.GLOBAL
            )

            await client.interaction.replyEmbed(interaction, loadingEmbed)

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

            await client.playlist.deletePlaylist(name.toLowerCase())

            const embed = client.embed.createMessageEmbedWithAuthor(
                `🎶 Playlist **${playlist.name}** has been deleted 🎶`,
                member,
                EMBEDTYPE.SUCCESS
            )
            await client.interaction.replyEmbed(interaction, embed)
        } catch (error) {
            let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
                `⛔ There is an error while trying to delete playlist **${name}** ⛔`,
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

export default PlaylistDelete
