import { EmbedBuilder, type GuildMember } from 'discord.js'
import type { PlaylistResult, Track } from 'shoukaku'
import { COLOR, EMOJI } from '@/config'

enum EMBEDTYPE {
    GLOBAL = 'GLOBAL',
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
}

class EmbedManager {
    public createMessageEmbedWithAuthor(
        message: string,
        member: GuildMember,
        type: EMBEDTYPE
    ): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COLOR[type])
            .setAuthor({
                name: member.displayName,
                iconURL: member.displayAvatarURL(),
            })
            .setDescription(message)
            .setTimestamp()
            .setFooter({
                text: 'Made with 🩷 by LinCie',
                iconURL:
                    'https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png',
            })
    }

    public createMessageEmbed(message: string, type: EMBEDTYPE): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COLOR[type])
            .setDescription(message)
            .setTimestamp()
            .setFooter({
                text: 'Made with 🩷 by LinCie',
                iconURL:
                    'https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png',
            })
    }

    public createPlayingEmbed(track: Track, next?: Track): EmbedBuilder {
        const length = `<t:${Math.floor(Date.now() / 1000) + Math.floor(track.info.length / 1000)}:R>`

        return new EmbedBuilder()
            .setColor(COLOR.GLOBAL)
            .setTitle(track.info.title)
            .setURL(track.info.uri!)
            .setDescription(
                `${EMOJI[track.info.sourceName as keyof typeof EMOJI]} **${track.info.title}** is currently playing`
            )
            .setThumbnail(track.info.artworkUrl!)
            .addFields(
                {
                    name: 'Title',
                    value: track.info.title,
                    inline: true,
                },
                {
                    name: 'Artist',
                    value: track.info.author,
                    inline: true,
                },
                {
                    name: 'Next track in',
                    value: length,
                },
                {
                    name: 'Next in queue',
                    value: next?.info.title || 'No track left',
                }
            )
            .setTimestamp()
            .setFooter({
                text: 'Made with 🩷 by LinCie',
                iconURL:
                    'https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png',
            })
    }

    public createAddTrackEmbed(
        track: Track,
        member: GuildMember
    ): EmbedBuilder {
        return new EmbedBuilder()
            .setColor(COLOR.SUCCESS)
            .setAuthor({
                name: member.displayName,
                iconURL: member.displayAvatarURL(),
            })
            .setThumbnail(
                track?.info.artworkUrl ||
                    'https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png'
            )
            .setDescription(
                `${EMOJI[track.info.sourceName as keyof typeof EMOJI]} **${track?.info.title}** has been added to queue`
            )
            .addFields(
                {
                    name: 'Title',
                    value: track.info.title,
                    inline: true,
                },
                {
                    name: 'Artist',
                    value: track.info.author,
                    inline: true,
                }
            )
            .setTimestamp()
            .setFooter({
                text: 'Made with 🩷 by LinCie',
                iconURL:
                    'https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png',
            })
    }

    public createAddPlaylistEmbed(
        tracks: Track[],
        result: PlaylistResult,
        member: GuildMember
    ) {
        return new EmbedBuilder()
            .setColor(COLOR.SUCCESS)
            .setAuthor({
                name: member.displayName,
                iconURL: member.displayAvatarURL(),
            })
            .setThumbnail(tracks[0].info.artworkUrl!)
            .setDescription(
                `${EMOJI[tracks[0].info.sourceName as keyof typeof EMOJI]} ${tracks.length} tracks from playlist **${result.data.info.name}** has been added to queue`
            )
            .addFields(
                {
                    name: 'Title',
                    value: result.data.info.name,
                    inline: true,
                },
                {
                    name: 'Artist',
                    value: result.data.tracks[0]?.info.author,
                    inline: true,
                }
            )
            .setTimestamp()
            .setFooter({
                text: 'Made with 🩷 by LinCie',
                iconURL:
                    'https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png',
            })
    }
}

export { EmbedManager, EMBEDTYPE }
