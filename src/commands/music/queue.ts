import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Collection,
    ComponentType,
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

type QueueData = {
    current: Track
    tracks: Track[]
    page: number
}

class Queue extends Command {
    private queueData: Collection<string, QueueData> = new Collection()

    constructor() {
        super(data)
        this.use(IsPlayerExist)
    }

    private pages(guildId: string): number {
        const queue = this.queueData.get(guildId)!
        return Math.ceil(queue.tracks.length / 10) || 1
    }

    async nextQueue(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember
        const queue = this.queueData.get(member.id)!

        if (queue.page < this.pages(member.id)) {
            queue.page++
            await this.updateQueueMessage(interaction, client, member)
        } else {
            await interaction.deferUpdate()
        }
    }

    async previousQueue(client: Mika, interaction: ButtonInteraction) {
        const member = interaction.member as GuildMember
        const queue = this.queueData.get(member.id)!

        if (queue.page > 1) {
            queue.page--
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

        const queue: QueueData = {
            current: player.queue.getCurrent()!,
            tracks: player.queue.getTracks(),
            page: 1,
        }

        this.queueData.set(member.id, queue)

        await this.updateQueueMessage(interaction, client, member)
    }

    private async updateQueueMessage(
        interaction: ChatInputCommandInteraction | ButtonInteraction,
        client: Mika,
        member: GuildMember
    ) {
        const queue = this.queueData.get(member.id)!

        const startIndex = (queue.page - 1) * 10
        const endIndex = startIndex + 10
        const currentTracks = queue.tracks.slice(startIndex, endIndex)
        const currentlyPlaying = queue.current
        const playingEmoji =
            EMOJI[currentlyPlaying?.info.sourceName as keyof typeof EMOJI]

        const nextButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('next_queue')
            .setDisabled(queue.page >= this.pages(member.id))
            .setEmoji(EMOJI.next)

        const previousButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('previous_queue')
            .setDisabled(queue.page <= 1)
            .setEmoji(EMOJI.previous)

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

        const embedDescription = `## ${guildName}'s Queue\n${playingEmoji} **${currentlyPlaying?.info.title}** is currently playing\n${queueContent}\n-# Page ${queue.page} of ${this.pages(member.id)}`

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

        if (interaction.isChatInputCommand()) {
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.Button,
                idle: 1000 * 60 * 2,
            })

            collector.on('collect', async (buttonResponse) => {
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
            })

            collector.on('end', async () => {
                this.queueData.delete(member.id)

                const nextButton = new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('next_queue')
                    .setDisabled(true)
                    .setEmoji(EMOJI.next)

                const previousButton = new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('previous_queue')
                    .setDisabled(true)
                    .setEmoji(EMOJI.previous)

                const buttonRow =
                    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                        previousButton,
                        nextButton
                    )
                await response.edit({ components: [buttonRow] })
            })
        }
    }
}

export default Queue
