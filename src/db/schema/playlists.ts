import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

const playlists = pgTable("playlists", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	ownerId: varchar("owner_id", { length: 255 }).references(() => users.id),
	name: varchar("name", { length: 255 }).notNull(),
	list: text("list").array().notNull().default(sql`ARRAY[]::text[]`),
});

const playlistsRelations = relations(playlists, ({ one }) => ({
	owner: one(users, {
		fields: [playlists.ownerId],
		references: [users.id],
	}),
}));

type Playlist = typeof playlists.$inferSelect;
type NewPlaylist = typeof playlists.$inferInsert;
type UpdatePlaylist = Partial<NewPlaylist>;

export { playlists, playlistsRelations };
export type { Playlist, NewPlaylist, UpdatePlaylist };
