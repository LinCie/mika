import { relations } from "drizzle-orm";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { playlists } from "./playlists";

const users = pgTable("users", {
	id: varchar("id", { length: 255 }).primaryKey(),
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
