declare module 'bun' {
    interface Env {
        BOT_TOKEN: string
        CLIENT_ID: string
        GUILD_ID: string
        NODE_ENV: 'production' | 'development'
        TURSO_AUTH_TOKEN: string
        TURSO_DATABASE_URL: string
        OWNER_ID: string
        LOGGER_CHANNEL_ID: string
        ERROR_LOGGER_CHANNEL_ID: string
        GEMINI_API_KEY: string
        OPENAI_BASE_URL: string
        OPENAI_API_KEY: string
        OPENAI_MODEL: string
    }
}
