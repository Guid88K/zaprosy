import "server-only";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/zaprosy.db";

if (url.startsWith("file:") && !url.includes(":memory:")) {
  fs.mkdirSync(path.dirname(url.slice("file:".length)), { recursive: true });
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __zaprosyDb?: Db;
  __zaprosyMigration?: Promise<void>;
};

function createDb(): Db {
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

const db: Db = globalForDb.__zaprosyDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__zaprosyDb = db;

/** Повертає підключення до БД, попередньо застосувавши міграції (один раз на процес). */
export async function getDb(): Promise<Db> {
  if (!globalForDb.__zaprosyMigration) {
    globalForDb.__zaprosyMigration = migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    }).catch((err) => {
      globalForDb.__zaprosyMigration = undefined;
      throw err;
    });
  }
  await globalForDb.__zaprosyMigration;
  return db;
}

export { schema };
