import { Client, type ClientOptions } from "discord.js";
import { Connectors, Shoukaku } from "shoukaku";
import { lavalinkNodes } from "@/config";
import { logger } from "@/utils";
import type { BaseLogger } from "pino";

class Mika extends Client {
  public readonly shoukaku: Shoukaku;
  public readonly logger: BaseLogger;

  constructor(options: ClientOptions) {
    super(options);

    // Discord client
    this.once("ready", (client) =>
      this.logger.info("Mika is now ready and live <3")
    );

    // Shoukaku
    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(this), lavalinkNodes);
    this.shoukaku
      .on("ready", (name) =>
        this.logger.info(`Lavalink ${name} is now ready <3`)
      )
      .on("disconnect", (name) =>
        this.logger.warn(`${name} has been disconnected`)
      )
      .on("reconnecting", (name, left) =>
        this.logger.warn(
          `${name} is attempting to reconnect\n${left} ${
            left < 2 ? "try" : "tries"
          } left`
        )
      )
      .on("debug", (name, content) => {
        if (Bun.env.NODE_ENV === "development") {
          this.logger.warn(content, name);
        }
      })
      .on("error", (name, error) => this.logger.error(error, name));

    // Logger
    this.logger = logger;
  }
}

export { Mika };
