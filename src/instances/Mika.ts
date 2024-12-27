import { commands, commandsData } from "@/commands";
import {
	BOT_CLIENT_ID,
	DEV_GUILD_ID,
	DISCORD_TOKEN,
	NODE_ENV,
	lavalinkNodes,
} from "@/config";
import type { DeployCommandsProps } from "@/types";
import { logger } from "@/utils";
import {
	type CacheType,
	type ClientOptions,
	type Interaction,
	Client,
	REST,
	Routes,
} from "discord.js";
import type { BaseLogger } from "pino";
import { Connectors, Shoukaku } from "shoukaku";

class Mika extends Client {
	public readonly shoukaku: Shoukaku;
	public readonly logger: BaseLogger;
	public readonly rest: REST;

	constructor(options: ClientOptions) {
		super(options);

		// Logger
		this.logger = logger;

		// Discord REST
		this.rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

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
				if (NODE_ENV === "development") {
					this.logger.warn(content, name);
				}
			})
			.on("error", (name, error) => this.logger.error(error, name));

		// Discord client
		this.once("ready", async () => {
			if (NODE_ENV === "development") {
				await this.deployDevCommands({ guildId: DEV_GUILD_ID });
			} else {
				await this.deployGlobalCommands();
			}
			this.logger.info("Mika is now ready and live <3");
		})
			.on("interactionCreate", (interaction) => this.runCommands(interaction))
			.on("error", (error) => this.logger.error(error));
	}

	async runCommands(interaction: Interaction<CacheType>) {
		if (!interaction.isCommand()) {
			return;
		}
		const { commandName } = interaction;
		if (commands[commandName as keyof typeof commands]) {
			commands[commandName as keyof typeof commands].execute(this, interaction);
		}
	}

	async deployDevCommands({ guildId }: DeployCommandsProps) {
		try {
			this.logger.info("Started refreshing dev application (/) commands.");

			await this.rest.put(
				Routes.applicationGuildCommands(BOT_CLIENT_ID, guildId),
				{
					body: commandsData,
				},
			);

			this.logger.info("Successfully reloaded dev application (/) commands.");
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async deployGlobalCommands() {
		try {
			this.logger.info("Started refreshing global application (/) commands.");

			await this.rest.put(Routes.applicationCommands(BOT_CLIENT_ID), {
				body: commandsData,
			});

			this.logger.info(
				"Successfully reloaded global application (/) commands.",
			);
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}
}

export { Mika };
