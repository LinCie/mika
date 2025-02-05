import type { GuildMember } from "discord.js";
import type { Track } from "shoukaku";
import { sql, type Insertable, type Selectable } from "kysely";
import type { Playlist } from "@/db";
import type { Mika } from "../Mika";

class PlaylistManager {
	private readonly client: Mika;

	constructor(client: Mika) {
		this.client = client;
	}

	public createPlaylist(
		name: string,
		member: GuildMember,
	): Promise<Selectable<Playlist>> {
		const playlist: Insertable<Playlist> = { userId: member.id, name };
		return this.client.db
			.insertInto("Playlist")
			.values(playlist)
			.returningAll()
			.executeTakeFirstOrThrow();
	}

	public async getPlaylistByName(name: string): Promise<Selectable<Playlist>> {
		return this.client.db
			.selectFrom("Playlist")
			.where("name", "=", name)
			.selectAll()
			.executeTakeFirstOrThrow();
	}

	public async getPlaylistById(id: number): Promise<Selectable<Playlist>> {
		return this.client.db
			.selectFrom("Playlist")
			.where("id", "=", id)
			.selectAll()
			.executeTakeFirstOrThrow();
	}

	public async getUserPlaylists(
		member: GuildMember,
	): Promise<Selectable<Playlist>[]> {
		return this.client.db
			.selectFrom("Playlist")
			.where("userId", "=", member.user.id)
			.selectAll()
			.execute();
	}

	public async addTrackToPlaylist(
		track: Track,
		playlistId: number,
		member: GuildMember,
	): Promise<Selectable<Playlist>> {
		return this.client.db
			.updateTable("Playlist")
			.set({ songs: sql`array_append(songs, \'${track.info.uri}\')` })
			.where("userId", "=", member.user.id)
			.where("id", "=", playlistId)
			.returningAll()
			.executeTakeFirstOrThrow();
	}
}

export { PlaylistManager };
