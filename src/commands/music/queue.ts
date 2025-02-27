import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
    type MessageActionRowComponentBuilder,
} from 'discord.js'
import type { Track } from 'shoukaku'
import { Command, EMBEDTYPE, Mika, PlayerManager } from '@/instances'
import { IsPlayerExist } from '@/middlewares'
import { EMOJI } from '@/config'

const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show current queue')

class Queue extends Command {
    private player: PlayerManager | undefined
    private tracks: Track[] = []
    private page = 1
    private get pages(): number {
        return Math.ceil(this.tracks.length / 10) || 1
    }

    constructor() {
        super(data)
        this.use(IsPlayerExist)
    }

    async nextQueue(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember

        if (this.page < this.pages) {
            this.page++
            await this.updateQueueMessage(interaction, client, member)
        } else {
            await interaction.deferUpdate()
        }
    }

    async previousQueue(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember

        if (this.page > 1) {
            this.page--
            await this.updateQueueMessage(interaction, client, member)
        } else {
            await interaction.deferUpdate()
        }
    }

    async command(
        client: Mika,
        interaction: ChatInputCommandInteraction | ButtonInteraction,
        context: { player: PlayerManager; member: GuildMember }
    ) {
        const { player, member } = context

        this.tracks = player.queue.getTracks()
        this.page = 1
        this.player = player

        await this.updateQueueMessage(interaction, client, member)
    }

    private async updateQueueMessage(
        interaction: ChatInputCommandInteraction | ButtonInteraction,
        client: Mika,
        member: GuildMember
    ) {
        const startIndex = (this.page - 1) * 10
        const endIndex = startIndex + 10
        const currentTracks = this.tracks.slice(startIndex, endIndex)
        const currentlyPlaying = this.player?.queue.getCurrent()
        const playingEmoji =
            EMOJI[currentlyPlaying?.info.sourceName as keyof typeof EMOJI]

        const nextButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setCustomId('next_queue')
            .setDisabled(this.page >= this.pages)
            .setEmoji('⏭️')

        const previousButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setCustomId('previous_queue')
            .setDisabled(this.page <= 1)
            .setEmoji('⏮️')

        const buttonRow =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                previousButton,
                nextButton
            )

        const guildName = interaction.guild?.name || 'Server'
        const queueContent =
            currentTracks
                .map((track, index) => {
                    if (track === currentlyPlaying) {
                        return `${startIndex + index + 1}. [${track.info.title}](${track.info.uri}) ~ ${track.info.author} ${EMOJI.music}`
                    }
                    return `${startIndex + index + 1}. [${track.info.title}](${track.info.uri}) ~ ${track.info.author}`
                })
                .join('\n') || 'No tracks in the queue.'

        const embedDescription = `## ${guildName}'s Queue\n${playingEmoji} **${currentlyPlaying?.info.title}** is currently playing\n${queueContent}\n-# Page ${this.page} of ${this.pages}`

        const embed = client.embed
            .createMessageEmbedWithAuthor(
                embedDescription,
                member!,
                EMBEDTYPE.GLOBAL
            )
            .setThumbnail(interaction.guild?.iconURL() || '')

        const response = await client.interaction.replyEmbedWithButton(
            interaction,
            embed,
            buttonRow
        )

        const buttonResponse = await response.awaitMessageComponent()

        switch (buttonResponse.customId) {
            case 'next_queue':
                await this.nextQueue(
                    client,
                    buttonResponse as ButtonInteraction
                )
                break
            case 'previous_queue':
                await this.previousQueue(
                    client,
                    buttonResponse as ButtonInteraction
                )
                break
        }
    }
}

export default Queue
