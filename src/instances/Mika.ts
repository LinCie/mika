import { Client, type ClientOptions } from "discordx";
import { Connectors, Shoukaku } from "shoukaku";
import { pino, type BaseLogger } from "pino";
import { drizzle } from "drizzle-orm/neon-http";
import { DATABASE_URL, NODE_ENV, lavalinkNodes } from "@/config";
import type { PlayerManager } from "./manager/PlayerManager";
import { EmbedManager } from "./manager/EmbedManager";
import { InteractionManager } from "./manager/InteractionManager";

class Mika extends Client {
	public readonly shoukaku: Shoukaku;
	public readonly pino: BaseLogger;
	public readonly embed: EmbedManager;
	public readonly interaction: InteractionManager;
	public readonly players: Map<string, PlayerManager>;
	public readonly db;

	constructor(options: ClientOptions) {
		super(options);

		// Logger
		this.pino = pino();

		// Player
		this.players = new Map<string, PlayerManager>();

		// Embed
		this.embed = new EmbedManager();

		// Interaction
		this.interaction = new InteractionManager();

		// Database
		this.db = drizzle(DATABASE_URL);

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
			.on("ready", (name) =>
				this.pino.info(`Lavalink node ${name} is now ready <3`),
			)
			.on("disconnect", (name) =>
				this.pino.warn(`Lavalink node ${name} has been disconnected`),
			)
			.on("reconnecting", (name, left) =>
				this.pino.warn(
					`Lavalink node ${name} is attempting to reconnect\n${left} ${
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
}

export { Mika };
