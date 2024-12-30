import {
	BOT_CLIENT_ID,
	DEV_GUILD_ID,
	DISCORD_TOKEN,
	NODE_ENV,
	lavalinkNodes,
} from "@/config";
import type { DeployCommandsProps } from "@/types";
import {
	type CacheType,
	type ClientOptions,
	type Interaction,
	Client,
	REST,
	Routes,
} from "discord.js";
import { pino, type BaseLogger } from "pino";
import { Connectors, Shoukaku } from "shoukaku";
import type { MikaPlayer } from "./MikaPlayer";
import { MikaCommandHandler } from "./MikaCommandHandler";
import path from "node:path";

class Mika extends Client {
	public readonly shoukaku: Shoukaku;
	public readonly logger: BaseLogger;
	public readonly rest: REST;
	public players: Map<string, MikaPlayer>;
	public commandHandler: MikaCommandHandler;

	constructor(options: ClientOptions) {
		super(options);

		// Logger
		this.logger = pino();

		// Discord REST
		this.rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

		// Player
		this.players = new Map<string, MikaPlayer>();

		// Commands
		this.commandHandler = new MikaCommandHandler(this);
		const commandsPath = path.join(__dirname, "../commands");
		this.commandHandler.loadCommands(commandsPath);

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
				if (NODE_ENV === "debug") {
					this.logger.debug(content, name);
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

	/**
	 * Handles incoming interactions and executes corresponding commands.
	 *
	 * @param interaction - The interaction received from Discord. It must be a chat input command.
	 *
	 * @remarks
	 * This function checks if the interaction is a valid command and has a command name.
	 * If valid, it attempts to execute the command using the command handler.
	 * Errors during command execution are logged.
	 */
	async runCommands(interaction: Interaction<CacheType>) {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.isCommand()) return;
		const { commandName } = interaction;
		if (!commandName) return;

		try {
			await this.commandHandler.runCommand(interaction);
		} catch (error) {
			this.logger.error(error);
		}
	}

	/**
	 * Deploys development slash commands to a specific guild.
	 *
	 * @param {DeployCommandsProps} param0 - The parameters for deploying commands.
	 * @param {string} param0.guildId - The ID of the guild to which dev commands are deployed.
	 *
	 * @remarks
	 * This function is intended for use in development environments to refresh
	 * application commands for a specified guild. It logs the start and success
	 * of the operation, and throws an error if the operation fails.
	 *
	 * @throws {Error}
	 * Thrown if there is an error while deploying the commands.
	 */
	async deployDevCommands({ guildId }: DeployCommandsProps) {
		try {
			this.logger.info("Started refreshing dev application (/) commands.");
			const commandsData = this.commandHandler.getCommandDataArray();

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

	/**
	 * Deploy global slash commands.
	 *
	 * @remarks
	 * This is a production only function. It will be skipped in development environment.
	 *
	 * @throws {Error}
	 * Thrown if there is an error while deploying commands.
	 */
	async deployGlobalCommands() {
		try {
			this.logger.info("Started refreshing global application (/) commands.");
			const commandsData = this.commandHandler.getCommandDataArray();

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
