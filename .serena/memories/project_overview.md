# Project Overview

Mika is a Bun + TypeScript Discord bot. The README describes it as a multi-functional Discord bot with music playback, playlist management, AI chat, and owner/developer commands.

Core stack:
- Runtime/package manager: Bun.
- Language: TypeScript, ESM modules (`"type": "module"`).
- Discord API: `discord.js` v14.
- Music: Shoukaku with Lavalink; Lavalink config lives in `application.yml` / `application.yml.example`.
- Database: Prisma 6 with LibSQL/Turso adapter; schema currently defines a `Playlist` model.
- AI integrations: Google Gemini via `@google/genai`; OpenAI-compatible config vars are also present.
- Logging: `pino` and `pino-pretty`.

Important structure:
- `src/mika.ts`: main bot entrypoint, instantiates `Mika` and logs in using `BOT_TOKEN`.
- `src/instances/Mika.ts`: main Discord client subclass; registers events and commands by globbing `src/events/**/*.ts` and `src/commands/**/*.ts`; owns managers and Shoukaku setup.
- `src/instances/base/`: abstract base types for commands, subcommands, and client events.
- `src/instances/manager/`: managers for AI, embeds, interactions, players, playlists, and queues.
- `src/commands/`: Discord slash commands grouped by domain (`ai`, `dev`, `music`, `utilities`).
- `src/events/`: Discord event handlers.
- `src/middlewares/`: command middleware such as guild-only, owner-only, voice/player checks, and deferred replies.
- `src/config/`: environment and Lavalink node config.
- `src/database/`: Prisma/LibSQL setup and types.
- `prisma/`: Prisma schema and migrations.
- `scripts/getLavalink.ts`: helper to download Lavalink.

Runtime requirements from README:
- Bun.
- Java 17+ for Lavalink.
- A Lavalink server/JAR.
- Turso or SQLite-compatible database configuration.
- Discord bot credentials and environment variables from `.env.example`.

Repository note:
- During onboarding, no `AGENTS.md` file was present in the repository root, but the user supplied AGENTS.md-style operating instructions in the conversation. Follow those along with higher-priority instructions.