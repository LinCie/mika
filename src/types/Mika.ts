import { Client, type ClientOptions } from "discord.js";
import { Connectors, Shoukaku } from "shoukaku";
import { lavalinkNodes } from "@/config";

class Mika extends Client {
  public readonly shoukaku: Shoukaku;

  constructor(options: ClientOptions) {
    super(options);
    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(this), lavalinkNodes);
  }
}

export { Mika };
