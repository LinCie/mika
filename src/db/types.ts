import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Playlist = {
    id: Generated<number>;
    userId: string;
    name: string;
    songs: Generated<string[]>;
};
export type DB = {
    Playlist: Playlist;
};
