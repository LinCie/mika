import { GatewayIntentBits, Partials } from "discord.js";
import { Mika } from "@/instances";

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
