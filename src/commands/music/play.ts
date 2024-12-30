import type { Mika } from "@/instances";
import { MikaCommands, MikaPlayer } from "@/instances";
import { type CommandInteraction, SlashCommandBuilder } from "discord.js";
import { LoadType } from "shoukaku";

const data = new SlashCommandBuilder()
	.setName("play")
	.setDescription("play a music")
	.addStringOption((option) =>
		option
			.setName("query")
			.setDescription("could be the name of the music or a URL")
			.setRequired(true),
	)
	.addStringOption((option) =>
		option
			.setName("method")
			.setDescription("the search method, defaults to soundcloud search")
			.addChoices(
				{ name: "Soundcloud", value: "scsearch" },
				{ name: "Youtube", value: "ytsearch" },
				{ name: "Youtube Music", value: "ytmsearch" },
			),
	)
	.toJSON();

export default class Play extends MikaCommands {
	constructor(client: Mika, interaction: CommandInteraction) {
		super(client, interaction);
		this.commandOptions = { isDeferred: true };
	}

	async main() {
		let player: MikaPlayer;
		if (this.client.players.has(this.interaction.guild?.id!)) {
			player = this.client.players.get(this.interaction.guild?.id!)!;
		} else {
			player = await new MikaPlayer(this.client, this.interaction).init();
		}

		const query = this.interaction.options.get("query", true).value as string;
		const method = (this.interaction.options.get("method")?.value ??
			"scsearch") as string;

		const result = await player.searchMusic(query, method);

		switch (result?.loadType) {
			case LoadType.SEARCH: {
				const track = result.data.shift();
				if (track) {
					player.queue.addTrack(track);
					if (player.queue.getLength() === 1) {
						player.playMusic(track);
					}
					await this.interaction.editReply(
						`${track?.info.title} has been added to queue`,
					);
				}
				break;
			}

			case LoadType.TRACK: {
				const track = result.data;
				player.queue.addTrack(track);
				if (player.queue.getLength() === 1) {
					player.playMusic(track);
				} else if (player.queue.current === player.queue.getLength() - 2) {
					player.playMusic(player.queue.playNext()!);
				}
				await this.interaction.editReply(
					`${track?.info.title} has been added to queue`,
				);
				break;
			}

			case LoadType.EMPTY: {
				await this.interaction.editReply(
					`No result found with query "${query}"`,
				);
				break;
			}

			case LoadType.ERROR: {
				await this.interaction.editReply(
					"An error had occured. Please try again later <3",
				);
				this.client.logger.error(result.data.message, result.data.cause);
				break;
			}
		}
	}
}

export { data };
