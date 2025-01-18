import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

	dialect: "postgresql",
	schema: "./src/db/schema",
	out: "./src/db/migrations",

	migrations: {
		prefix: "timestamp",
		table: "__drizzle_migrations__",
		schema: "public",
	},
});
