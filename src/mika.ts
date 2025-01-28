import { ActivityType, GatewayIntentBits } from "discord.js";
import type { Interaction, Message } from "discord.js";
import { dirname, importx } from "@discordx/importer";
import { NotBot } from "@discordx/utilities";
import { Mika } from "@/instances";
import { DISCORD_TOKEN } from "./config";
import { GuildOnly } from "./guards";

const mika = new Mika({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildVoiceStates,
	],
	silent: false,

	simpleCommand: {
		prefix: "mika!",
	},

	guards: [GuildOnly, NotBot],
});

mika.once("ready", async () => {
	// Make sure all guilds are cached
	await mika.guilds.fetch();

	// Synchronize applications commands with Discord
	void mika.initApplicationCommands();

	// To clear all guild commands, uncomment this line,
	// This is useful when moving from guild commands to global commands
	// It must only be executed once
	//
	//  await mika.clearApplicationCommands(
	//    ...mika.guilds.cache.map((g) => g.id)
	//  );

	mika.pino.info("Mika is alive!");

	// Presence
	mika.user?.setPresence({
		activities: [{
			name: "/play",
			type: ActivityType.Listening
		}],
		status: "online"
	});
});

mika.on("interactionCreate", (interaction: Interaction) => {
	mika.executeInteraction(interaction);
});

mika.on("messageCreate", (message: Message) => {
	void mika.executeCommand(message);
});

mika.on("error", (error) => {
	mika.pino.error(error);
});

async function run() {
	// The following syntax should be used in the commonjs environment
	//
	// await importx(__dirname + "/{events,commands}/**/*.{ts,js}");

	// The following syntax should be used in the ECMAScript environment
	await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

	// Let's start the bot
	if (!DISCORD_TOKEN) {
		throw Error("Could not find DISCORD_TOKEN in your environment");
	}

	// Log in with your bot token
	await mika.login(DISCORD_TOKEN);
}

void run();
