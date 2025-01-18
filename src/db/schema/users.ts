import { relations } from "drizzle-orm";
import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { playlists } from "./playlists";

const users = pgTable("users", {
	id: integer("id").primaryKey(),
	username: varchar("username", { length: 255 }).notNull().unique(),
});

const usersRelations = relations(users, ({ many }) => ({
	playlists: many(playlists),
}));

type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
type UpdateUser = Partial<NewUser>;

export { users, usersRelations };
export type { User, NewUser, UpdateUser };
