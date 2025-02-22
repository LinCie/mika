declare module 'bun' {
    interface Env {
        BOT_TOKEN: string
        CLIENT_ID: string
        GUILD_ID: string
        NODE_ENV: 'production' | 'development'
    }
}
