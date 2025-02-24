declare module 'bun' {
    interface Env {
        BOT_TOKEN: string
        CLIENT_ID: string
        GUILD_ID: string
        NODE_ENV: 'production' | 'development'
        TURSO_AUTH_TOKEN: string
        TURSO_DATABASE_URL: string
    }
}
