import { GatewayIntentBits, Partials } from "discord.js";
import { Mika } from "@/types";

const mika = new Mika({
  partials: [Partials.Channel, Partials.GuildMember, Partials.User],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

export { mika };
