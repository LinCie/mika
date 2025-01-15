import {
	ApplicationCommandOptionType,
	EmbedBuilder,
	type GuildMember,
	type CommandInteraction,
} from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { LoadType } from "shoukaku";
import { EMBEDTYPE } from "@/instances";
import type { Mika, PlayerManager } from "@/instances";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerCurrent,
	IsPlayerInit,
} from "@/guards";

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
		method = "scsearch",

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	): Promise<void> {
		const { player, member } = data;
		const result = await player.searchMusic(query, method);

		switch (result?.loadType) {
			case LoadType.SEARCH: {
				const track = result.data.shift();
				if (track) {
					player.queue.addTrack(track);
					const embed = client.embed.createAddTrackEmbed(track, member);
					await client.interaction.replyEmbed(interaction, embed);
				}
				break;
			}

			case LoadType.TRACK: {
				const track = result.data;
				if (track) {
					player.queue.addTrack(track);
					const embed = client.embed.createAddTrackEmbed(track, member);
					await client.interaction.replyEmbed(interaction, embed);
				}
				break;
			}

			case LoadType.PLAYLIST: {
				const tracks = result.data.tracks;
				if (tracks) {
					const embed = client.embed.createAddPlaylistEmbed(
						tracks,
						result,
						member,
					);
					player.queue.addTracks(tracks);
					await client.interaction.replyEmbed(interaction, embed);
				}
				break;
			}

			case LoadType.EMPTY: {
				const embed = client.embed.createMessageEmbed(
					`No result found with query "${query}"`,
					EMBEDTYPE.ERROR,
				);
				await client.interaction.replyEmbed(interaction, embed, {
					ephemeral: true,
				});
				break;
			}

			case LoadType.ERROR: {
				const embed = client.embed.createMessageEmbed(
					"An error had occured. Please try again later </3",
					EMBEDTYPE.ERROR,
				);
				await client.interaction.replyEmbed(interaction, embed, {
					ephemeral: true,
				});
				client.pino.error(result.data.message, result.data.cause);
				break;
			}
		}
	}
}

export { Play };
