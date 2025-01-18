import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema.ts",
	out: "./src/db/migrations",

	migrations: {
		prefix: "timestamp",
		table: "__drizzle_migrations__",
		schema: "public",
	},
});
