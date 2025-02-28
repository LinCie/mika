import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
    type MessageActionRowComponentBuilder,
} from 'discord.js'
import { Prisma } from '@prisma/client'
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'
import type { Track } from 'shoukaku'
import { EMOJI } from '@/config'

class PlaylistGet extends Subcommand {
    private playlistName = 'Playlist'
    private tracks: Track[] = []
    private page = 1
    private get pages(): number {
        return Math.ceil(this.tracks.length / 10) || 1
    }

    async nextList(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember

        if (this.page < this.pages) {
            this.page++
            await this.updateListMessage(interaction, client, member)
        } else {
            await interaction.deferUpdate()
        }
    }

    async previousList(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember

        if (this.page > 1) {
            this.page--
            await this.updateListMessage(interaction, client, member)
        } else {
            await interaction.deferUpdate()
        }
    }

    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand
                .setName('get')
                .setDescription('get a playlist')
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
            const playlist = await client.playlist.getPlaylistByName(
                name.toLowerCase()
            )

            this.tracks = JSON.parse(playlist.musics)
            this.page = 1
            this.playlistName = playlist.name

            await this.updateListMessage(interaction, client, member)
        } catch (error) {
            let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
                `⛔ There is an error while trying to get playlist **${name}** ⛔`,
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

    private async updateListMessage(
        interaction: ChatInputCommandInteraction | ButtonInteraction,
        client: Mika,
        member: GuildMember
    ) {
        const startIndex = (this.page - 1) * 10
        const endIndex = startIndex + 10
        const currentTracks = this.tracks.slice(startIndex, endIndex)

        const nextButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('next_list')
            .setDisabled(this.page >= this.pages)
            .setEmoji(EMOJI.next)

        const previousButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('previous_list')
            .setDisabled(this.page <= 1)
            .setEmoji(EMOJI.previous)

        const buttonRow =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                previousButton,
                nextButton
            )

        const listContent =
            currentTracks
                .map(
                    (track, index) =>
                        `${startIndex + index + 1}. [${track.info.title}](${track.info.uri}) ~ ${track.info.author}`
                )
                .join('\n') || 'No tracks in the playlist.'

        const embedDescription = `### ${this.playlistName}'s Tracks\n\n${listContent}\n-# Page ${this.page} of ${this.pages}`

        const embed = client.embed
            .createMessageEmbedWithAuthor(
                embedDescription,
                member!,
                EMBEDTYPE.GLOBAL
            )
            .setThumbnail(member.displayAvatarURL())

        const response = await client.interaction.replyEmbedWithButton(
            interaction,
            embed,
            buttonRow
        )

        try {
            const buttonResponse = await response.awaitMessageComponent({
                time: 1000 * 60 * 2,
            })

            switch (buttonResponse.customId) {
                case 'next_list':
                    await this.nextList(
                        client,
                        buttonResponse as ButtonInteraction
                    )
                    break
                case 'previous_list':
                    await this.previousList(
                        client,
                        buttonResponse as ButtonInteraction
                    )
                    break
            }
        } catch {
            client.logger.debug('Bruh')
        }
    }
}

export default PlaylistGet
