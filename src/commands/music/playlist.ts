import {
	type GuildMember,
	type CommandInteraction,
	ApplicationCommandOptionType,
} from "discord.js";
import {
	Discord,
	Guard,
	Slash,
	SlashChoice,
	SlashGroup,
	SlashOption,
} from "discordx";
import {
	EMBEDTYPE,
	LoopState,
	type Mika,
	type PlayerManager,
} from "@/instances";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
	IsPlayerInit,
} from "@/guards";
import { LoadType, type Track } from "shoukaku";

@Discord()
@SlashGroup({ name: "playlist", description: "Playlist Manager" })
@SlashGroup("playlist")
class Playlist {
	@Slash({ description: "Create a playlist" })
	@Guard(DeferReply)
	async create(
		@SlashOption({
			name: "name",
			description: "The playlist name",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		name: string,

		interaction: CommandInteraction,
		client: Mika,
	) {
		const member = interaction.member as GuildMember;

		try {
			const playlist = await client.playlist.createPlaylist(name, member);

			const embed = client.embed.createMessageEmbedWithAuthor(
				`Created playlist with name \'${playlist.name}\'`,
				member,
				EMBEDTYPE.SUCCESS,
			);
			await client.interaction.replyEmbed(interaction, embed);
		} catch (error) {
			client.pino.error(error);

			const embed = client.embed.createMessageEmbedWithAuthor(
				"There is an error while adding playlist",
				member,
				EMBEDTYPE.ERROR,
			);
			await client.interaction.replyEmbed(interaction, embed);
		}
	}

	@Slash({ description: "Add a music to playlist" })
	@Guard(DeferReply, IsPlayerExist)
	async add(
		@SlashOption({
			name: "playlist",
			description: "The name of the playlist",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		name: string,

		@SlashOption({
			name: "url",
			description: "The song url",
			required: false,
			type: ApplicationCommandOptionType.String,
		})
		url: string | undefined,

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;

		try {
			let song: Track | Track[] | undefined;
			if (!url) {
				song = player.queue.getCurrent();
			} else {
				const result = await player.searchMusic(url, "url");

				switch (result?.loadType) {
					case LoadType.TRACK:
						song = result.data;
						break;
					case LoadType.PLAYLIST:
						song = result.data.tracks;
						break;
					default:
						throw new Error("Invalid URL");
				}
			}

			const playlist = await client.playlist.getPlaylistByName(name);

			if (playlist.userId !== member.user.id) {
				const embed = client.embed.createMessageEmbedWithAuthor(
					"You're not the owner of this playlist",
					member,
					EMBEDTYPE.ERROR,
				);
				await client.interaction.replyEmbed(interaction, embed);
				return;
			}

			if (!song) {
				throw new Error("Empty result");
			}

			if (Array.isArray(song)) {
				for (const track of song) {
					playlist.songs.push(track.info.uri!);
				}
			} else {
				playlist.songs.push(song.info.uri!);
			}

			await client.playlist.addTrackToPlaylist(playlist.id, playlist);

			if (Array.isArray(song)) {
				const embed = client.embed.createMessageEmbedWithAuthor(
					`Successfully added your playlist to playlist \'${playlist.name}\'`,
					member,
					EMBEDTYPE.SUCCESS,
				);
				await client.interaction.replyEmbed(interaction, embed);
			} else {
				const embed = client.embed.createMessageEmbedWithAuthor(
					`Successfully added ${song} to playlist \'${playlist.name}\'`,
					member,
					EMBEDTYPE.SUCCESS,
				);
				await client.interaction.replyEmbed(interaction, embed);
			}
		} catch (error) {
			client.pino.error(error);

			const embed = client.embed.createMessageEmbedWithAuthor(
				"There is an error while adding music to playlist",
				member,
				EMBEDTYPE.ERROR,
			);
			await client.interaction.replyEmbed(interaction, embed);
		}
	}

	@Slash({ description: "Play a playlist" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerInit, IsPlayerCurrent)
	async play(
		@SlashOption({
			name: "name",
			description: "The playlist name",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		name: string,

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;

		try {
			const playlist = await client.playlist.getPlaylistByName(name);

			for (const song of playlist.songs) {
				await player.addMusic(song, "", member, true);
			}

			const embed = client.embed.createMessageEmbedWithAuthor(
				`\'${playlist.name}\' has been added to queue`,
				member,
				EMBEDTYPE.SUCCESS,
			);
			await client.interaction.replyEmbed(interaction, embed);
		} catch (error) {
			client.pino.error(error);

			const embed = client.embed.createMessageEmbedWithAuthor(
				"There is an error while adding playlist to queue",
				member,
				EMBEDTYPE.ERROR,
			);
			await client.interaction.replyEmbed(interaction, embed);
		}
	}
}

export { Playlist };
