/**
 * Database access layer.
 * Uses @tauri-apps/plugin-sql
 */

import Database from "@tauri-apps/plugin-sql";

export interface DatabaseLike {
  select<T>(sql: string, params?: any[]): Promise<T>;
  execute(
    sql: string,
    params?: any[]
  ): Promise<{ lastInsertId: number; rowsAffected: number } | any>;
}

let dbInstance: Database | null = null;

async function getTauriDb(): Promise<DatabaseLike> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:proyek.db");
  }

  return {
    select: <T>(sql: string, params?: any[]): Promise<T> =>
      dbInstance!.select<T>(sql, params),
    execute: async (
      sql: string,
      params?: any[]
    ): Promise<{ lastInsertId: number; rowsAffected: number }> => {
      const res = await dbInstance!.execute(sql, params);
      return {
        lastInsertId: res.lastInsertId ?? 0,
        rowsAffected: res.rowsAffected
      };
    },
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
