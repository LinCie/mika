import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
    type MessageActionRowComponentBuilder,
} from 'discord.js'
import { Command, EMBEDTYPE, Mika, PlayerManager } from '@/instances'
import { IsInVoiceChannel, IsPlayerCurrent, IsPlayerExist } from '@/middlewares'
import youtubeDl from 'youtube-dl-exec'
import { fetch } from 'bun'
import { EMOJI } from '@/config'

const data = new SlashCommandBuilder()
    .setName('download')
    .setDescription('Download current music')

class Stop extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
        this.use(IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
    }

    async command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: { player: PlayerManager; member: GuildMember }
    ) {
        const { player, member } = context

        let music = player.queue.getCurrent()
        if (music?.info.sourceName === 'spotify') {
            music = await player.changeMusicSource(
                music.info.title + ' ' + music.info.author,
                'ytmsearch'
            )
        }

        const url =
            music?.info.uri || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        const path =
            __dirname +
            '/..' +
            '/..' +
            '/..' +
            '/download/' +
            `${new Date().getTime().toString()}-${music?.info.title}.mp3`

        try {
            const emoji = EMOJI[music?.info.sourceName as keyof typeof EMOJI]
            const initialEmbed = client.embed.createMessageEmbedWithAuthor(
                `${emoji} **${music?.info.title}** is currently downloading...`,
                member,
                EMBEDTYPE.GLOBAL
            )
            await client.interaction.replyEmbed(interaction, initialEmbed)

            await youtubeDl(url, {
                format: 'bestaudio',
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: 0,
                output: path,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
            })

            const file = Bun.file(path)
            const formData = new FormData()
            formData.append('file', file)
            const response = await fetch(
                `https://w.buzzheavier.com/${music?.info.title}.mp3`,
                {
                    method: 'PUT',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )

            if (response.ok) {
                const responseJson = await response.json()
                const downloadUrl = `https://buzzheavier.com/${responseJson.data.id}`
                const button = new ButtonBuilder()
                    .setLabel('Download from Buzzheavier')
                    .setURL(downloadUrl)
                    .setStyle(ButtonStyle.Link)

                const row =
                    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                        button
                    )

                const successEmbed = client.embed.createMessageEmbedWithAuthor(
                    `${EMOJI.music} **${music?.info.title}** has been downloaded!\n[Download Link](${downloadUrl})`,
                    member,
                    EMBEDTYPE.SUCCESS
                )

                await client.interaction.replyEmbedWithButton(
                    interaction,
                    successEmbed,
                    row
                )

                await file.delete()
            } else {
                throw new Error(response.statusText)
            }
        } catch (error) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                '⛔ There is an error while trying to download music ⛔',
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed)
            throw error
        }
    }
}

export default Stop
