# Code Style And Conventions

Language and module style:
- TypeScript with ESM imports/exports.
- `tsconfig.json` uses `strict: true`, `moduleResolution: "bundler"`, `noEmit: true`, `allowImportingTsExtensions: true`, and path alias `@/* -> ./src/*`.
- Imports commonly use the `@/` alias for internal modules outside nearby relative imports.

Formatting:
- Prettier config: 4-space indentation, no semicolons, single quotes, trailing commas where valid in ES5.
- Keep existing formatting and avoid whole-file reformatting unless needed.

Linting:
- ESLint flat config with `@eslint/js` recommended, `typescript-eslint` recommended, and `eslint-config-prettier`.
- Existing code occasionally uses targeted `eslint-disable-next-line` for `@typescript-eslint/no-explicit-any` around middleware generics.

Naming and structure:
- Main classes use PascalCase (`Mika`, `Command`, `Subcommand`, `ClientEvent`, manager classes).
- Environment constants are uppercase exports from `src/config/env.ts`.
- Commands are class-based and extend `Command`; subcommands extend `Subcommand`.
- Client events extend `ClientEvent` and implement `register()`.
- Middleware functions follow the `(client, interaction, next, context) => Promise<void>` shape and are composed in command execution.

Design patterns:
- `Mika` dynamically imports events and commands using Bun/Node globbing, then instantiates default-exported classes.
- Global command middleware is currently `[DeferReply, GuildOnly]` and is attached to command instances during registration.
- Dev/guild-only commands are separated with `isGuildOnly`; global and guild commands are registered separately with Discord REST.
- Database access is centralized through exported `prisma` from `src/database/database.ts`.

Editing guidance:
- Keep changes local to the target command, manager, middleware, or config area.
- Prefer existing base classes and manager APIs over new abstractions.
- Be careful with startup/registration code because it can affect every command and Discord command registration.