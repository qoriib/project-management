export interface DatabaseLike {
  select<T>(sql: string, params?: any[]): Promise<T>;
  execute(sql: string, params?: any[]): Promise<{ lastInsertId: number; rowsAffected: number } | any>;
}

let _tauriDb: any = null;

export async function getDB(): Promise<DatabaseLike> {
  // If running in Node.js (command line seed script)
  if (typeof window === "undefined") {
    const { getLocalNodeDb } = await import("./node-db");
    return getLocalNodeDb() as any as DatabaseLike;
  }

  if (_tauriDb) return _tauriDb as DatabaseLike;

  const Database = (await import("@tauri-apps/plugin-sql")).default;
  _tauriDb = await Database.load("sqlite:proyek_v11.db");

  return _tauriDb as DatabaseLike;
}
