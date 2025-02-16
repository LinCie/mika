export * from "./lavalink";

export enum COLOR {
	GLOBAL = 0xffe9f3,
	SUCCESS = 0xa3be8c,
	WARNING = 0xebcb8b,
	ERROR = 0xbf616a,
}

export enum EMOJI {
	youtube = "<:youtube:1340641837471240233>",
	soundcloud = "<:soundcloud:1340641801823977563>",
	spotify = "<:spotify:1340641784371609610>",
}

export const GLOBAL_COLOR = 0xffe9f3;

export const NODE_ENV = Bun.env.NODE_ENV!;
export const DISCORD_TOKEN = Bun.env.DISCORD_TOKEN!;
export const DEV_GUILD_ID = Bun.env.DEV_GUILD_ID!;
export const BOT_CLIENT_ID = Bun.env.BOT_CLIENT_ID!;
export const TURSO_DATABASE_URL = Bun.env.TURSO_DATABASE_URL!;
export const TURSO_AUTH_TOKEN = Bun.env.TURSO_AUTH_TOKEN!;
export const OWNER_ID = Bun.env.OWNER_ID!;
