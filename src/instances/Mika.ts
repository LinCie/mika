import { commands, commandsData } from "@/commands";
import {
	BOT_CLIENT_ID,
	DEV_GUILD_ID,
	DISCORD_TOKEN,
	NODE_ENV,
	lavalinkNodes,
} from "@/config";
import type { DeployCommandsProps } from "@/types";
import Denque from "denque";
import {
	type CacheType,
	type ClientOptions,
	type Interaction,
	Client,
	REST,
	Routes,
} from "discord.js";
import { pino, type BaseLogger } from "pino";
import { Connectors, type Player, Shoukaku, type Track } from "shoukaku";
import type { MikaPlayer } from "./MikaPlayer";

class Mika extends Client {
	public readonly shoukaku: Shoukaku;
	public readonly logger: BaseLogger;
	public readonly rest: REST;
	public queue: { current: number; content: Denque<Track> };
	public players: Array<MikaPlayer>;
	public player: Player | null = null;

	constructor(options: ClientOptions) {
		super(options);

		// Logger
		this.logger = pino();

		// Discord REST
		this.rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

		// Denque
		this.queue = { current: 0, content: new Denque<Track>() };

		// Player
		this.players = [];

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
	 * Handles incoming interactions and executes the corresponding command.
	 *
	 * @param {Interaction<CacheType>} interaction - The interaction to be handled.
	 *
	 * @remarks
	 * This function first checks if the interaction is a command. If it is, it
	 * retrieves the command name from the interaction and checks if the command
	 * is registered in the commands object. If the command is registered, it
	 * calls the execute method of the command and passes the client and interaction
	 * as arguments.
	 */
	async runCommands(interaction: Interaction<CacheType>) {
		if (!interaction.isCommand()) {
			return;
		}
		const { commandName } = interaction;
		if (commands[commandName as keyof typeof commands]) {
			commands[commandName as keyof typeof commands].execute(this, interaction);
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
