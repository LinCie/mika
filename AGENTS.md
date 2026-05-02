# Repository Guidelines

## Project Structure & Module Organization

Mika is a Bun and TypeScript Discord bot. Runtime source lives in `src/`;
`src/mika.ts` creates the client, and `src/instances/Mika.ts` owns startup,
command registration, managers, and Lavalink integration.

- `src/commands/`: slash commands grouped by domain, such as `music`, `ai`,
  `dev`, and `utilities`.
- `src/events/`: Discord client event handlers.
- `src/middlewares/`: guild, owner, voice, and player checks.
- `src/instances/manager/`: music, queue, playlist, AI, embed, and interaction
  managers.
- `src/config/`: environment and Lavalink node configuration.
- `src/database/`: Prisma and LibSQL/Turso setup.
- `prisma/`: schema and migrations.
- `scripts/`: helpers such as Lavalink download tooling.

## Build, Test, and Development Commands

- `bun install --frozen-lockfile`: install dependencies from `bun.lock`.
- `bun run dev`: run the bot with `NODE_ENV=development`.
- `bun run start`: run the production entrypoint.
- `bun run lava:get`: download `Lavalink.jar` into `lavalink/`.
- `bun run lava`: start the local Lavalink server.
- `bun run prisma:migrate`: apply Prisma migrations in development.
- `bun run prisma:generate`: regenerate the Prisma client.
- `bunx tsc --noEmit`: type-check the project.
- `bunx eslint .`: run ESLint.
- `bunx prettier --check .`: verify formatting.

## Coding Style & Naming Conventions

Use TypeScript ESM imports. Prefer the `@/` alias for non-local internal
imports. Prettier uses 4-space indentation, single quotes, trailing commas, and
no semicolons.

Name classes in PascalCase, for example `PlaylistManager` or `ClientEvent`.
Export environment constants in uppercase from `src/config/env.ts`. Commands
default-export a `Command` subclass; subcommands extend `Subcommand`; events
extend `ClientEvent`.

## Testing Guidelines

No test framework or coverage target is currently configured. For changes, run
the narrowest useful checks: `bunx tsc --noEmit`, `bunx eslint .`, and
`bunx prettier --check .` when formatting is relevant.

If adding tests later, colocate them near covered code or introduce a `tests/`
directory, and add a `package.json` script for consistent execution.

## Commit & Pull Request Guidelines

Recent history uses short Conventional Commit-style messages, such as
`feat: add stream response to ai` and `chore: remove download information`.
Use a lowercase type prefix (`feat:`, `fix:`, `chore:`, `docs:`) and an
imperative summary.

Pull requests should describe behavior changes, list verification commands,
link related issues when applicable, and note required environment, database,
Discord, or Lavalink setup.

## Security & Configuration Tips

Do not commit `.env`, bot tokens, database credentials, API keys, or Lavalink
secrets. Start from `.env.example`, and keep local `application.yml` changes
limited to development configuration unless the change is intentional.
