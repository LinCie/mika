import type { GuildMember } from "discord.js";
import type { Track } from "shoukaku";
import type { Mika } from "../Mika";
import { playlists, type NewPlaylist, type Playlist } from "@/db";
import { eq } from "drizzle-orm";

class PlaylistManager {
	private readonly client: Mika;

	constructor(client: Mika) {
		this.client = client;
	}

	public createPlaylist(name: string, member: GuildMember) {
		const playlist: NewPlaylist = { name, ownerId: member.id };
		return this.client.db.insert(playlists).values(playlist).returning();
	}

	public async getPlaylist(playlistId: number) {
		const result = await this.client.db
			.select()
			.from(playlists)
			.where(eq(playlists.id, playlistId));
		return result.shift();
	}

	public async addTrackToPlaylist(
		track: Track,
		playlistId: number,
		member: GuildMember,
	) {
		const playlist = await this.getPlaylist(playlistId);
		if (!playlist) return;
		if (playlist.ownerId !== member.id) return;

		const newPlaylist = [...playlist.list, track.info.uri!];
		return this.client.db
			.update(playlists)
			.set({ list: newPlaylist })
			.where(eq(playlists.id, playlistId));
	}
}

export { PlaylistManager };
