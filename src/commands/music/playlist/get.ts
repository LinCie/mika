import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Collection,
    ComponentType,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
    type MessageActionRowComponentBuilder,
} from 'discord.js'
import { Prisma } from '@prisma/client'
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'
import type { Track } from 'shoukaku'
import { EMOJI } from '@/config'

type GetData = {
    playlistName: string
    tracks: Track[]
    page: number
}

class PlaylistGet extends Subcommand {
    private getData: Collection<string, GetData> = new Collection()

    private pages(memberId: string): number {
        const get = this.getData.get(memberId)!
        return Math.ceil(get.tracks.length / 10) || 1
    }

    async nextList(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember
        const get = this.getData.get(member.id)!

        if (get.page < this.pages(member.id)) {
            get.page++
            await this.updateListMessage(interaction, client, member)
        } else {
            await interaction.deferUpdate()
        }
    }

    async previousList(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember
        const get = this.getData.get(member.id)!

        if (get.page > 1) {
            get.page--
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
            const loadingEmbed = client.embed.createMessageEmbedWithAuthor(
                `${EMOJI.loading} Fetching your playlist...`,
                member,
                EMBEDTYPE.GLOBAL
            )

            await client.interaction.replyEmbed(interaction, loadingEmbed)

            const playlist = await client.playlist.getPlaylistByName(
                name.toLowerCase()
            )

            const get: GetData = {
                tracks: JSON.parse(playlist.musics),
                page: 1,
                playlistName: playlist.name,
            }

            this.getData.set(member.id, get)

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
        const get = this.getData.get(member.id)!

        const startIndex = (get.page - 1) * 10
        const endIndex = startIndex + 10
        const currentTracks = get.tracks.slice(startIndex, endIndex)

        const nextButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('next_list')
            .setDisabled(get.page >= this.pages(member.id))
            .setEmoji(EMOJI.next)

        const previousButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('previous_list')
            .setDisabled(get.page <= 1)
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

        const embedDescription = `### ${get.playlistName}'s Tracks\n\n${listContent}\n-# Page ${get.page} of ${this.pages(member.id)}`

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

        if (interaction.isChatInputCommand()) {
            try {
                const collector = response.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    idle: 1000 * 60 * 2,
                })

                collector.on('collect', async (buttonResponse) => {
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
                })

                collector.on('end', async () => {
                    this.getData.delete(member.id)

                    const nextButton = new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('next_list')
                        .setDisabled(true)
                        .setEmoji(EMOJI.next)

                    const previousButton = new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('previous_list')
                        .setDisabled(true)
                        .setEmoji(EMOJI.previous)

                    const buttonRow =
                        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                            previousButton,
                            nextButton
                        )
                    await response.edit({ components: [buttonRow] })
                })
            } catch {
                client.logger.debug('Bruh')
            }
        }
    }
}

export default PlaylistGet
