import { GLOBAL_COLOR, NODE_ENV, lavalinkNodes } from "@/config";
import { pino, type BaseLogger } from "pino";
import { Connectors, Shoukaku } from "shoukaku";
import type { MikaPlayer } from "./Player";
import { Client, type ClientOptions } from "discordx";
import {
	EmbedBuilder,
	type CommandInteraction,
	type GuildMember,
} from "discord.js";

class Mika extends Client {
	public readonly shoukaku: Shoukaku;
	public readonly pino: BaseLogger;
	public players: Map<string, MikaPlayer>;

	constructor(options: ClientOptions) {
		super(options);

		// Logger
		this.pino = pino();

		// Player
		this.players = new Map<string, MikaPlayer>();

		// Shoukaku
		this.shoukaku = new Shoukaku(
			new Connectors.DiscordJS(this),
			lavalinkNodes,
			{
				resumeTimeout: 30,
				resume: true,
				resumeByLibrary: true,
				moveOnDisconnect: true,
				reconnectTries: 10,
				reconnectInterval: 10,
			},
		);
		this.shoukaku
			.on("ready", (name) => this.pino.info(`Lavalink ${name} is now ready <3`))
			.on("disconnect", (name) =>
				this.pino.warn(`${name} has been disconnected`),
			)
			.on("reconnecting", (name, left) =>
				this.pino.warn(
					`${name} is attempting to reconnect\n${left} ${
						left < 2 ? "try" : "tries"
					} left`,
				),
			)
			.on("debug", (name, content) => {
				if (NODE_ENV === "debug") {
					this.pino.debug(content, name);
				}
			})
			.on("error", (name, error) => this.pino.error(error, name));
	}

	async sendMessageEmbed(
		interaction: CommandInteraction,
		member: GuildMember,
		message: string,
	) {
		const embed = new EmbedBuilder()
			.setColor(GLOBAL_COLOR)
			.setAuthor({
				name: member?.displayName!,
				iconURL: member?.displayAvatarURL(),
			})
			.setDescription(message)
			.setTimestamp()
			.setFooter({
				text: "Made with 🩷 by LinCie",
				iconURL:
					"https://static.wikia.nocookie.net/blue-archive/images/d/dd/Mika_Icon.png",
			});
		await interaction.editReply({ embeds: [embed] });
	}
}

export { Mika };
