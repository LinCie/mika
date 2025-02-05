import type { DB } from "./types.ts";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { DATABASE_URL } from "@/config/index.ts";

const dialect = new PostgresDialect({
	pool: new Pool({ connectionString: DATABASE_URL }),
});

export const db = new Kysely<DB>({
	dialect,
});
