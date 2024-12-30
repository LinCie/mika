import { DeferReply } from "@/guards";
import type { Mika } from "@/instances";
import { MikaPlayer } from "@/instances";
import {
	ApplicationCommandOptionType,
	type CommandInteraction,
} from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { LoadType } from "shoukaku";

@Discord()
class Play {
	@Slash({ description: "play" })
	@Guard(DeferReply)
	async play(
		@SlashOption({
			name: "query",
			description: "The search query. Could be name or URL",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		query: string,
		@SlashChoice({ name: "Soundcloud", value: "scsearch" })
		@SlashChoice({ name: "Youtube", value: "ytsearch" })
		@SlashChoice({ name: "Youtube Music", value: "ytmsearch" })
		@SlashOption({
			name: "method",
			description: "The search method. Defaults to Soundcloud",
			required: false,
			type: ApplicationCommandOptionType.String,
		})
		method: string | undefined,
		interaction: CommandInteraction,
		client: Mika,
	): Promise<void> {
		let player: MikaPlayer;
		if (client.players.has(interaction.guild?.id!)) {
			player = client.players.get(interaction.guild?.id!)!;
		} else {
			player = await new MikaPlayer(client, interaction).init();
		}

		const result = await player.searchMusic(query, method ?? "scsearch");

		switch (result?.loadType) {
			case LoadType.SEARCH: {
				const track = result.data.shift();
				if (track) {
					player.queue.addTrack(track);
					await interaction.editReply(
						`${track?.info.title} has been added to queue`,
					);
				}
				break;
			}

			case LoadType.TRACK: {
				const track = result.data;
				player.queue.addTrack(track);
				await interaction.editReply(
					`${track?.info.title} has been added to queue`,
				);
				break;
			}

			case LoadType.PLAYLIST: {
				const tracks = result.data.tracks;
				player.queue.addTracks(tracks);
				await interaction.editReply(
					`${tracks.length} ${tracks.length > 1 ? "tracks" : "track"} has been added to queue from playlist ${result.data.info.name}`,
				);
				break;
			}

			case LoadType.EMPTY: {
				await interaction.editReply(`No result found with query "${query}"`);
				break;
			}

			case LoadType.ERROR: {
				await interaction.editReply(
					"An error had occured. Please try again later <3",
				);
				client.pino.error(result.data.message, result.data.cause);
				break;
			}
		}
	}
}

export { Play };
