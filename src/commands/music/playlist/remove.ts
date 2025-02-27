import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Prisma } from '@prisma/client'
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'
import type { Track } from 'shoukaku'

class PlaylistRemove extends Subcommand {
    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand
                .setName('remove')
                .setDescription('remove a track from playlist')
                .addStringOption((option) =>
                    option
                        .setName('name')
                        .setDescription('The playlist name')
                        .setRequired(true)
                )
                .addNumberOption((option) =>
                    option
                        .setName('position')
                        .setDescription('The position of removed track')
                        .setRequired(true)
                )
        )
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember

        const name = interaction.options.getString('name', true)
        const position = interaction.options.getNumber('position', true)

        try {
            const playlist = await client.playlist.getPlaylistByName(
                name.toLowerCase()
            )
            const tracks: Track[] = JSON.parse(playlist.musics)
            const truePosition = position - 1

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

            if (truePosition < 0 || truePosition > tracks.length) {
                const embed = client.embed.createMessageEmbedWithAuthor(
                    `⛔ Position **${position}** is out of range ⛔`,
                    member,
                    EMBEDTYPE.ERROR
                )

                await client.interaction.replyEmbed(interaction, embed, {
                    ephemeral: true,
                })
            }

            const removedTrack = tracks[truePosition]
            playlist.musics = JSON.stringify(
                tracks.filter((track, idx) => idx !== truePosition)
            )
            await client.playlist.updatePlaylist(playlist)

            const embed = client.embed.createMessageEmbedWithAuthor(
                `🎶 **${removedTrack.info.title}** has been removed from playlist **${name}** 🎶`,
                member,
                EMBEDTYPE.SUCCESS
            )
            await client.interaction.replyEmbed(interaction, embed)
        } catch (error) {
            let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
                `⛔ There is an error while trying to remove track from playlist **${name}** ⛔`,
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

export default PlaylistRemove
