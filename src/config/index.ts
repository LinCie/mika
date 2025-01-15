export * from "./lavalink";

export enum COLORS {
	GLOBAL = 0xffe9f3,
	SUCCESS = 0xa3be8c,
	WARNING = 0xebcb8b,
	ERROR = 0xbf616a,
}

export const GLOBAL_COLOR = 0xffe9f3;

export const NODE_ENV = Bun.env.NODE_ENV!;
export const DISCORD_TOKEN = Bun.env.DISCORD_TOKEN!;
export const DEV_GUILD_ID = Bun.env.DEV_GUILD_ID!;
export const BOT_CLIENT_ID = Bun.env.BOT_CLIENT_ID!;
