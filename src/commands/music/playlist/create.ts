import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Prisma } from '@prisma/client'
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'
import { EMOJI } from '@/config'

class PlaylistCreate extends Subcommand {
    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand
                .setName('create')
                .setDescription('create a playlist')
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
                `${EMOJI.loading} Creating your playlist...`,
                member,
                EMBEDTYPE.GLOBAL
            )

            await client.interaction.replyEmbed(interaction, loadingEmbed)

            const playlist = await client.playlist.createPlaylist(
                name.toLowerCase(),
                member
            )

            const embed = client.embed.createMessageEmbedWithAuthor(
                `🎶 Playlist **${playlist.name}** has been created 🎶`,
                member,
                EMBEDTYPE.SUCCESS
            )
            await client.interaction.replyEmbed(interaction, embed)
        } catch (error) {
            let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
                `⛔ There is an error while trying to create playlist **${name}** ⛔`,
                member,
                EMBEDTYPE.ERROR
            )

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'SQLITE_CONSTRAINT') {
                    embed = client.embed.createMessageEmbedWithAuthor(
                        '⛔ Playlist name must be unique ⛔',
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

export default PlaylistCreate
