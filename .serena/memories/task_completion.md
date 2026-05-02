# Task Completion Checklist

Before reporting completion for code changes:
- Review the diff with `git diff -- <path>` or an equivalent focused diff.
- Confirm all changed lines relate to the requested task; avoid unrelated refactors or formatting churn.
- Run the narrowest useful validation first.
- Since no package-level test/lint/check scripts existed at onboarding, choose from:
  - `bunx tsc --noEmit` for type checking.
  - `bunx eslint .` for linting.
  - `bunx prettier --check .` for formatting verification.
  - Targeted runtime smoke checks only when required and safe, because the bot needs Discord credentials, database config, and Lavalink.
- If touching Prisma schema or database code, consider `bun run prisma:generate` and relevant migration checks.
- If touching Lavalink/music behavior, note whether a live Lavalink/Discord smoke test was possible.
- If touching commands/events, verify class registration conventions: default-exported class, extends the correct base type, and command data is configured properly.

Final report should include:
- Files changed.
- Behavior changed.
- Verification commands run and their results.
- Anything not verified due to missing credentials/services or absent scripts.