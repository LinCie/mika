import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Collection,
    EmbedBuilder,
    GuildMember,
    SlashCommandBuilder,
    type MessageActionRowComponentBuilder,
} from 'discord.js'
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'
import type { Playlist } from '@prisma/client'
import type { Track } from 'shoukaku'
import { EMOJI } from '@/config'

type ListData = {
    playlists: Playlist[]
    page: number
}

class PlaylistList extends Subcommand {
    private listData: Collection<string, ListData> = new Collection()

    private pages(memberId: string): number {
        const list = this.listData.get(memberId)!
        return Math.ceil(list.playlists.length / 10) || 1
    }

    async nextList(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember
        const list = this.listData.get(member.id)!

        if (list.page < this.pages(member.id)) {
            list.page++
            await this.updateListMessage(interaction, client, member)
        } else {
            await interaction.deferUpdate()
        }
    }

    async previousList(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember
        const list = this.listData.get(member.id)!

        if (list.page > 1) {
            list.page--
            await this.updateListMessage(interaction, client, member)
        } else {
            await interaction.deferUpdate()
        }
    }

    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand.setName('list').setDescription('List your playlists')
        )
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember

        try {
            const playlists = await client.playlist.getUserPlaylists(member)

            const list: ListData = {
                playlists: playlists,
                page: 1,
            }
            this.listData.set(member.id, list)

            await this.updateListMessage(interaction, client, member)
        } catch (error) {
            const embed: EmbedBuilder =
                client.embed.createMessageEmbedWithAuthor(
                    '⛔ There is an error while trying to get playlists ⛔',
                    member,
                    EMBEDTYPE.ERROR
                )

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
        const list = this.listData.get(member.id)!

        const startIndex = (list.page - 1) * 10
        const endIndex = startIndex + 10
        const currentTracks = list.playlists.slice(startIndex, endIndex)

        const nextButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('next_list')
            .setDisabled(list.page >= this.pages(member.id))
            .setEmoji(EMOJI.next)

        const previousButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('previous_list')
            .setDisabled(list.page <= 1)
            .setEmoji(EMOJI.previous)

        const buttonRow =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                previousButton,
                nextButton
            )

        const listContent =
            currentTracks
                .map((playlist, index) => {
                    const musics: Track[] = JSON.parse(playlist.musics)
                    return `${startIndex + index + 1}. **${playlist.name}** ~ ${musics.length} tracks`
                })
                .join('\n') || 'You have no playlist'

        const embedDescription = `### ${member.displayName}'s Playlists\n\n${listContent}\n-# Page ${list.page} of ${this.pages(member.id)}`

        const embed = client.embed
            .createMessageEmbedWithAuthor(
                embedDescription,
                member,
                EMBEDTYPE.GLOBAL
            )
            .setThumbnail(member.displayAvatarURL())

        const response = await client.interaction.replyEmbedWithButton(
            interaction,
            embed,
            buttonRow
        )

        try {
            const collector = response.createMessageComponentCollector({
                time: 1000 * 60 * 2,
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
                this.listData.delete(member.id)

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

export default PlaylistList
