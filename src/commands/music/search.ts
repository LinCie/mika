import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ComponentType,
    GuildMember,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    type MessageActionRowComponentBuilder,
} from 'discord.js'
import { Command, EMBEDTYPE, Mika, PlayerManager } from '@/instances'
import { IsInVoiceChannel, IsPlayerCurrent, IsPlayerInit } from '@/middlewares'
import { EMOJI } from '@/config'

const data = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search a music')
    .addStringOption((option) =>
        option
            .setName('query')
            .setDescription('The search query. Could be name or URL')
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('source')
            .setDescription('The search source. Defaults to soundcloud')
            .setRequired(false)
            .addChoices(
                { name: 'Soundcloud', value: 'scsearch' },
                { name: 'Youtube Music', value: 'ytmsearch' },
                { name: 'Youtube', value: 'ytsearch' },
                { name: 'Spotify', value: 'spsearch' }
            )
    )

class Search extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
        this.use(IsInVoiceChannel, IsPlayerInit, IsPlayerCurrent)
    }

    async command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: { player: PlayerManager; member: GuildMember }
    ) {
        const { player, member } = context

        const query = interaction.options.getString('query', true)
        const source = interaction.options.getString('source') || 'scsearch'

        try {
            const result = await player.getSearchResult(query, source)
            const sourceName = result?.at(0)?.info.sourceName
            const emoji = EMOJI[sourceName as keyof typeof EMOJI]

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('selectTrack')
                .setPlaceholder('Choose a track')
                .addOptions(
                    result?.map((track, index) => {
                        let title = track.info.title
                        if (title.length > 80) {
                            title = title.slice(0, 77) + '...'
                        }
                        return {
                            label: title,
                            value: index.toString(),
                            description: track.info.author,
                        }
                    }) || []
                )

            const row =
                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                    selectMenu
                )

            const queueContent =
                result
                    ?.map((track, index) => {
                        return `${index + 1}. [${track.info.title}](${track.info.uri}) ~ ${track.info.author}`
                    })
                    .join('\n') || 'No track found.'
            const embedDescription = `${emoji} Search result for **${query}**\n${queueContent}`
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
                row
            )

            if (interaction.isChatInputCommand()) {
                const collector = response.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 1000 * 60 * 2,
                })

                collector.on('collect', async (selectResponse) => {
                    await selectResponse.deferUpdate()

                    const selectedIndex = Number(selectResponse.values[0])
                    if (result) {
                        const track = result[selectedIndex]
                        player.queue.addTrack(track)

                        const embed = client.embed.createAddTrackEmbed(
                            track,
                            member
                        )
                        await response.edit({ embeds: [embed], components: [] })
                    }

                    collector.stop()
                })

                collector.on('end', async () => {
                    await response.edit({ components: [] })
                })
            }
        } catch (error) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ There is an error while trying to search music ⛔',
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed)
            throw error
        }
    }
}

export default Search
