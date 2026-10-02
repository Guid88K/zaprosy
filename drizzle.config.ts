import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./data/zaprosy.db";
const isLocalFile = url.startsWith("file:");

// Для локального SQLite-файлу створюємо теку, інакше libsql не зможе відкрити базу.
if (isLocalFile && !url.includes(":memory:")) {
  fs.mkdirSync(path.dirname(url.slice("file:".length)), { recursive: true });
}

const shared = { schema: "./src/db/schema.ts", out: "./drizzle" } as const;

// Локально це звичайний SQLite, у хмарі (Turso) потрібен dialect "turso" з токеном.
export default defineConfig(
  isLocalFile
    ? { ...shared, dialect: "sqlite", dbCredentials: { url } }
    : {
        ...shared,
        dialect: "turso",
        dbCredentials: { url, authToken: process.env.DATABASE_AUTH_TOKEN },
      },
);
