import { GLOBAL_COLOR } from "@/config";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerAlreadyExist,
	IsPlayerCurrent,
	IsPlayerInit,
} from "@/guards";
import type { Mika } from "@/instances";
import type { MikaPlayer } from "@/instances";
import {
	ApplicationCommandOptionType,
	EmbedBuilder,
	type CommandInteraction,
} from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { LoadType } from "shoukaku";

@Discord()
class Play {
	@Slash({ description: "Play a music" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerInit, IsPlayerCurrent)
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
		data: { player: MikaPlayer },
	): Promise<void> {
		const player = data.player;
		const result = await player.searchMusic(query, method ?? "scsearch");

		switch (result?.loadType) {
			case LoadType.SEARCH: {
				const track = result.data.shift();
				if (track) {
					const addEmbed = new EmbedBuilder()
						.setColor(GLOBAL_COLOR)
						.setAuthor({
							name: interaction.user.displayName,
							iconURL: interaction.user.displayAvatarURL(),
						})
						.setThumbnail(track?.info.artworkUrl!)
						.setDescription(
							`🎶 **${track?.info.title}** has been added to queue 🎶`,
						);
					player.queue.addTrack(track);
					await interaction.editReply({ embeds: [addEmbed] });
				}
				break;
			}

			case LoadType.TRACK: {
				const track = result.data;
				if (track) {
					const addEmbed = new EmbedBuilder()
						.setColor(GLOBAL_COLOR)
						.setAuthor({
							name: interaction.user.displayName,
							iconURL: interaction.user.displayAvatarURL(),
						})
						.setThumbnail(track?.info.artworkUrl!)
						.setDescription(
							`🎶 **${track?.info.title}** has been added to queue 🎶`,
						);
					player.queue.addTrack(track);
					await interaction.editReply({ embeds: [addEmbed] });
				}
				break;
			}

			case LoadType.PLAYLIST: {
				const tracks = result.data.tracks;
				if (tracks) {
					const addEmbed = new EmbedBuilder()
						.setColor(GLOBAL_COLOR)
						.setAuthor({
							name: interaction.user.displayName,
							iconURL: interaction.user.displayAvatarURL(),
						})
						.setThumbnail(tracks.shift()?.info.artworkUrl!)
						.setDescription(
							`🎶 ${tracks.length} tracks from playlist **${result.data.info.name}** has been added to queue 🎶`,
						);
					player.queue.addTracks(tracks);
					await interaction.editReply({ embeds: [addEmbed] });
				}
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
