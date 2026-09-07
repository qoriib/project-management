/**
 * Database access layer.
 * Uses @tauri-apps/plugin-sql
 */

import Database from "@tauri-apps/plugin-sql";
import { DB_SQLITE_URL } from "@/configs/database.config";
import { dbLog } from "./core/db-logger";

export interface DatabaseLike {
  select<T>(sql: string, params?: any[]): Promise<T>;
  execute(sql: string, params?: any[]): Promise<{ lastInsertId: number; rowsAffected: number } | any>;
}

let dbInstance: Database | null = null;

async function getTauriDb(): Promise<DatabaseLike> {
  if (!dbInstance) {
    dbInstance = await Database.load(DB_SQLITE_URL);

    // WAL journal_mode is set once in migration (001_init.sql) — persistent, no need to repeat here.

    // How long SQLite retries before throwing "database is locked" (ms).
    await dbInstance.execute("PRAGMA busy_timeout = 5000;");

    // NORMAL: fsync only at WAL checkpoints, not every write.
    // Faster than FULL with negligible durability risk on desktop.
    await dbInstance.execute("PRAGMA synchronous = NORMAL;");

    // Page cache size in pages (negative = KiB). -32768 = 32 MiB.
    // Reduces disk I/O for repeated reads of the same pages.
    await dbInstance.execute("PRAGMA cache_size = -32768;");

    // Store temp tables in memory instead of disk.
    await dbInstance.execute("PRAGMA temp_store = MEMORY;");

    // Memory-mapped I/O: let the OS map up to 256 MiB of the DB file.
    // Speeds up large sequential reads.
    await dbInstance.execute("PRAGMA mmap_size = 268435456;");

    // Enforce FK constraints (SQLite disables them by default).
    await dbInstance.execute("PRAGMA foreign_keys = ON;");

    dbLog.info("[Database] Connected and initialized SQLite pragmas successfully.");
  }

  return {
    execute: async (sql: string, params?: any[]): Promise<{ lastInsertId: number; rowsAffected: number }> => {
      const res = await dbInstance!.execute(sql, params);
      return {
        lastInsertId: res.lastInsertId ?? 0,
        rowsAffected: res.rowsAffected,
      };
    },
    select: <T>(sql: string, params?: any[]): Promise<T> => dbInstance!.select<T>(sql, params),
  };
}

/**
 * Node.js fallback — used by seed scripts (`vite-node`) which run outside Tauri.
 */
async function getNodeDb(): Promise<DatabaseLike> {
  const { getLocalNodeDb } = await import("./node-db");
  return getLocalNodeDb() as any as DatabaseLike;
}

export async function getDB(): Promise<DatabaseLike> {
  if (typeof window === "undefined") {
    return getNodeDb();
  }
  return getTauriDb();
}
