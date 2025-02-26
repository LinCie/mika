import {
    CommandInteraction,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Prisma } from '@prisma/client'
import type { Track } from 'shoukaku'
import { Command, EMBEDTYPE, Mika, PlayerManager } from '@/instances'
import { IsInVoiceChannel, IsPlayerCurrent, IsPlayerInit } from '@/middlewares'

const data = new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Playlist Manager')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('play')
            .setDescription('Play a playlist')
            .addStringOption((option) =>
                option
                    .setName('name')
                    .setDescription('The playlist name')
                    .setRequired(true)
            )
    )
    .toJSON()

class PlaylistPlay extends Command {
    constructor() {
        super(data)
        this.use(IsInVoiceChannel, IsPlayerInit, IsPlayerCurrent)
    }

    async command(
        client: Mika,
        interaction: CommandInteraction,
        context: { player: PlayerManager; member: GuildMember }
    ) {
        const { player, member } = context

        const name = this.get<string>('name', interaction)

        try {
            const playlist = await client.playlist.getPlaylistByName(
                name.toLowerCase()
            )

            const tracks: Track[] = JSON.parse(playlist.musics)
            player.queue.addTracks(tracks)

            const embed = client.embed.createMessageEmbedWithAuthor(
                `🎶 Playlist **${playlist.name}** has been added to queue 🎶`,
                member,
                EMBEDTYPE.SUCCESS
            )
            await client.interaction.replyEmbed(interaction, embed)
        } catch (error) {
            client.logger.error(error)

            let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
                `⛔ There is an error while trying to play music from playlist **${name}** ⛔`,
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
        }
    }
}

export default PlaylistPlay
