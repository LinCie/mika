import { relations } from "drizzle-orm";
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: integer("id").primaryKey(),
	username: varchar("username", { length: 255 }).notNull().unique(),
});

export const usersRelations = relations(users, ({ many }) => ({
	playlists: many(playlists),
}));

export const playlists = pgTable("playlists", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	ownerId: integer("owner_id").references(() => users.id),
	name: varchar("name", { length: 255 }).notNull(),
});

export const playlistsRelations = relations(playlists, ({ one }) => ({
	owner: one(users, {
		fields: [playlists.ownerId],
		references: [users.id],
	}),
}));
