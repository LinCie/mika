import { commands, commandsData } from "@/commands";
import { lavalinkNodes } from "@/config";
import type { DeployCommandsProps } from "@/types";
import { logger } from "@/utils";
import {
	type CacheType,
	Client,
	type ClientOptions,
	type Interaction,
	REST,
	Routes,
} from "discord.js";
import type { BaseLogger } from "pino";
import { Connectors, Shoukaku } from "shoukaku";

const rest = new REST({ version: "10" }).setToken(Bun.env.DISCORD_TOKEN!);

class Mika extends Client {
	public readonly shoukaku: Shoukaku;
	public readonly logger: BaseLogger;

	constructor(options: ClientOptions) {
		super(options);

		// Logger
		this.logger = logger;

		// Shoukaku
		this.shoukaku = new Shoukaku(new Connectors.DiscordJS(this), lavalinkNodes);
		this.shoukaku
			.on("ready", (name) =>
				this.logger.info(`Lavalink ${name} is now ready <3`),
			)
			.on("disconnect", (name) =>
				this.logger.warn(`${name} has been disconnected`),
			)
			.on("reconnecting", (name, left) =>
				this.logger.warn(
					`${name} is attempting to reconnect\n${left} ${
						left < 2 ? "try" : "tries"
					} left`,
				),
			)
			.on("debug", (name, content) => {
				if (Bun.env.NODE_ENV === "development") {
					this.logger.warn(content, name);
				}
			})
			.on("error", (name, error) => this.logger.error(error, name));

		// Discord client
		this.once("ready", () => this.logger.info("Mika is now ready and live <3"))
			.on(
				"guildCreate",
				async (guild) => await this.deployCommands({ guildId: guild.id }),
			)
			.on("interactionCreate", (interaction) => this.runCommands(interaction))
			.on("error", (error) => this.logger.error(error));
	}

	async runCommands(interaction: Interaction<CacheType>) {
		if (!interaction.isCommand()) {
			return;
		}
		const { commandName } = interaction;
		if (commands[commandName as keyof typeof commands]) {
			commands[commandName as keyof typeof commands].execute(interaction);
		}
	}

	async deployCommands({ guildId }: DeployCommandsProps) {
		try {
			this.logger.info("Started refreshing application (/) commands.");

			await rest.put(
				Routes.applicationGuildCommands(Bun.env.DISCORD_CLIENT_ID!, guildId),
				{
					body: commandsData,
				},
			);

			this.logger.info("Successfully reloaded application (/) commands.");
		} catch (error) {
			this.logger.error(error);
		}
	}
}

export { Mika };
