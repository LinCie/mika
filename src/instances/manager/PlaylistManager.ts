import type { GuildMember } from 'discord.js'
import type { Mika } from '../Mika'
import type { PlaylistCreate } from '@/database'
import type { Playlist } from '@prisma/client'

class PlaylistManager {
    private readonly prisma

    constructor(client: Mika) {
        this.prisma = client.prisma
    }

    public createPlaylist(name: string, member: GuildMember) {
        const data: PlaylistCreate = {
            name: name,
            userId: member.user.id,
            musics: JSON.stringify([]),
        }
        return this.prisma.playlist.create({ data })
    }

    public async getPlaylistByName(name: string) {
        const playlist = await this.prisma.playlist.findFirstOrThrow({
            where: { name },
        })
        return playlist
    }

    public async getPlaylistById(id: number) {
        const playlist = await this.prisma.playlist.findFirstOrThrow({
            where: { id },
        })
        return playlist
    }

    public async getUserPlaylists(member: GuildMember) {
        const playlists = await this.prisma.playlist.findMany({
            where: { userId: member.user.id },
        })
        return playlists
    }

    public async addTrackToPlaylist(id: number, playlist: Playlist) {
        return this.prisma.playlist.update({
            where: { id },
            data: playlist,
        })
    }

    public async deletePlaylist(name: string) {
        return this.prisma.playlist.delete({ where: { name } })
    }

    public async updatePlaylist(playlist: Playlist) {
        return this.prisma.playlist.update({
            where: { id: playlist.id },
            data: playlist,
        })
    }
}

export { PlaylistManager }
