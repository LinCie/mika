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
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'
import type { Playlist } from '@prisma/client'
import type { Track } from 'shoukaku'

class PlaylistList extends Subcommand {
    private playlists: Playlist[] = []
    private page = 1
    private get pages(): number {
        return Math.ceil(this.playlists.length / 10) || 1
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
            subcommand.setName('list').setDescription('List your playlists')
        )
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember

        try {
            const playlists = await client.playlist.getUserPlaylists(member)

            this.playlists = playlists
            this.page = 1

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
        const startIndex = (this.page - 1) * 10
        const endIndex = startIndex + 10
        const currentTracks = this.playlists.slice(startIndex, endIndex)

        const nextButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setCustomId('next_list')
            .setDisabled(this.page >= this.pages)
            .setEmoji('⏭️')

        const previousButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setCustomId('previous_list')
            .setDisabled(this.page <= 1)
            .setEmoji('⏮️')

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

        const embedDescription = `### ${member.displayName}'s Playlists\n\n${listContent}\n-# Page ${this.page} of ${this.pages}`

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

export default PlaylistList
