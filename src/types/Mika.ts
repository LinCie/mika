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
    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(this), lavalinkNodes);
    this.logger = logger;
    this.shoukaku
      .on("ready", (name) =>
        this.logger.info(`Lavalink ${name} is now ready <3`)
      )
      .on("error", (name, error) => this.logger.error(error, name));
  }
}

export { Mika };
