import {
    CommandInteraction,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Prisma } from '@prisma/client'
import { Command, EMBEDTYPE, Mika } from '@/instances'

const data = new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Playlist Manager')
    .addSubcommand((subcommand) =>
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
    .toJSON()

class PlaylistCreate extends Command {
    constructor() {
        super(data)
    }

    async command(client: Mika, interaction: CommandInteraction) {
        const member = interaction.member as GuildMember

        const name = this.get<string>('name', interaction)

        try {
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
            client.logger.error(error)

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
        }
    }
}

export default PlaylistCreate
