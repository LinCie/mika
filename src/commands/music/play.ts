import type { Mika } from "@/instances";
import { MikaPlayer } from "@/instances";
import { type CommandInteraction, SlashCommandBuilder } from "discord.js";
import { LoadType, type Track } from "shoukaku";

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

async function execute(
	client: Mika,
	interaction: CommandInteraction,
): Promise<void> {
	await interaction.deferReply();

	let player: MikaPlayer;
	if (client.players.has(interaction.guild?.id!)) {
		player = client.players.get(interaction.guild?.id!)!;
	} else {
		player = await new MikaPlayer(client, interaction).init();
	}

	const query = interaction.options.get("query", true).value as string;
	const method = (interaction.options.get("method")?.value ??
		"scsearch") as string;

	const result = await player.searchMusic(query, method);

	switch (result?.loadType) {
		case LoadType.SEARCH: {
			const track = result.data.shift();
			if (track) {
				player.queue.addTrack(track);
				if (player.queue.getLength() === 1) {
					player.playMusic(track);
					await interaction.editReply(`${track?.info.title} is currently playing`);
				} else {
					await interaction.editReply(
						`${track?.info.title} has been added to queue`,
					);
				}
			}
			break;
		}

		case LoadType.TRACK: {
			const track = result.data;
			player.queue.addTrack(track);
			if (player.queue.getLength() === 1) {
				player.playMusic(track);
				await interaction.editReply(`${track?.info.title} is currently playing`);
			} else {
				await interaction.editReply(`${track?.info.title} has been added to queue`);
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
			client.logger.error(result.data.message, result.data.cause);
			break;
		}
	}
}

export { data, execute };
