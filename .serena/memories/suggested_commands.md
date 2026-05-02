# Suggested Commands

Setup:
- `bun install --frozen-lockfile` - install dependencies from `bun.lock`.
- Create `.env` from `.env.example` and fill Discord, database, logging, Lavalink, Gemini/OpenAI-compatible variables.
- `bun run prisma:migrate` - run Prisma migrations.
- `bun run prisma:generate` - generate Prisma client.
- `bun run lava:get` - download `Lavalink.jar` into `lavalink/`.

Run locally:
- `bun run lava` - start Lavalink with `java -jar lavalink/Lavalink.jar`.
- `bun run dev` - start the bot with `NODE_ENV=development bun run ./src/mika.ts | pino-pretty`.
- `bun run start` - start the bot with `NODE_ENV=production bun run ./src/mika.ts | pino-pretty`.

Production:
- `pm2 start` - starts apps using `ecosystem.config.js` if PM2 is installed.

Validation/checks:
- At onboarding time, `package.json` did not define `test`, `lint`, `format`, or `check` scripts.
- Use the closest local validation commands when needed:
  - `bunx tsc --noEmit` - TypeScript type check.
  - `bunx eslint .` - ESLint check using `eslint.config.mjs`.
  - `bunx prettier --check .` - formatting check.
  - `bunx prettier --write <paths>` - format touched files only when formatting is appropriate.

Useful Linux/repo commands:
- `git status --short` - inspect worktree state.
- `git diff -- <path>` - review changes to a specific file.
- `rg <pattern>` - fast text search.
- `rg --files` - list tracked/non-ignored files quickly.
- `sed -n '1,160p' <file>` - inspect part of a file.
- `ls -la` - top-level directory inspection.