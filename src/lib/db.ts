import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

declare global {
  // eslint-disable-next-line no-var
  var __coyDb: Database.Database | undefined;
}

function open() {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "coy.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      photo TEXT NOT NULL,
      bio TEXT NOT NULL,
      location TEXT NOT NULL,
      interests TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS swipes (
      profile_id INTEGER PRIMARY KEY REFERENCES profiles(id),
      direction TEXT NOT NULL CHECK (direction IN ('like','pass')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    -- Server-side only. Never exposed by any API. Powers the privacy promise.
    CREATE TABLE IF NOT EXISTS likes_me (
      profile_id INTEGER PRIMARY KEY REFERENCES profiles(id)
    );
    CREATE TABLE IF NOT EXISTS matches (
      profile_id INTEGER PRIMARY KEY REFERENCES profiles(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export const db = globalThis.__coyDb ?? (globalThis.__coyDb = open());