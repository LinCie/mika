import type { Mika } from "@/instances";
import { MikaPlayer } from "@/instances";
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

async function execute(
	client: Mika,
	interaction: CommandInteraction,
): Promise<void> {
	const player = new MikaPlayer(client, interaction);
	const query = interaction.options.get("query", true).value as string;
	const method = (interaction.options.get("method")?.value ??
		"scsearch") as string;

	if (!client.player) {
		await player.enterVoiceChannel();
	}

	const result = await player.searchMusic(query, method);

	switch (result?.loadType) {
		case LoadType.SEARCH: {
			const track = result.data.shift();
			client.queue.content.push(track!);
			if (client.queue.content.length === 1) {
				client.player?.playTrack({
					volume: 50,
					track: track,
				});
				await interaction.reply(`${track?.info.title} is currently playing`);
			} else {
				await interaction.reply(`${track?.info.title} has been added to queue`);
			}
			break;
		}
		case LoadType.EMPTY: {
			await interaction.reply(`No result found with query "${query}"`);
			break;
		}
		case LoadType.ERROR: {
			await interaction.reply(
				"An error had occured. Please try again later <3",
			);
			client.logger.error(result.data.message, result.data.cause);
			break;
		}
	}
}

export { data, execute };
