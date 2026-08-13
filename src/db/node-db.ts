// @ts-ignore
import { DatabaseSync } from "node:sqlite";
import * as path from "node:path";
import * as os from "node:os";

class NodeDatabaseWrapper {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
  }

  async select<T>(sql: string, params: any[] = []): Promise<T> {
    // node:sqlite expects standard SQL parameter bindings ($1, $2) or named parameters
    // Let's replace $1, $2 with ? if node:sqlite requires it.
    // Actually, node:sqlite supports ? out of the box, but let's convert $1, $2 to ? to match standard SQL syntax or just map them.
    const normalizedSql = sql.replace(/\$\d+/g, "?");
    const statement = this.db.prepare(normalizedSql);
    return statement.all(...params) as T;
  }

  async execute(sql: string, params: any[] = []): Promise<{ lastInsertId: number; rowsAffected: number }> {
    const normalizedSql = sql.replace(/\$\d+/g, "?");
    const statement = this.db.prepare(normalizedSql);
    const result = statement.run(...params);
    return {
      lastInsertId: Number(result.lastInsertRowid),
      rowsAffected: result.changes,
    };
  }
}

let _nodeDb: NodeDatabaseWrapper | null = null;

export function getLocalNodeDb(): NodeDatabaseWrapper {
  if (_nodeDb) return _nodeDb;

  const appIdentifier = "com.asus.project-management";
  let baseDir = "";

  if (process.platform === "win32") {
    baseDir = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  } else if (process.platform === "darwin") {
    baseDir = path.join(os.homedir(), "Library", "Application Support");
  } else {
    baseDir = path.join(os.homedir(), ".local", "share");
  }

  const dbPath = path.join(baseDir, appIdentifier, "proyek_v11.db");
  console.log("Connecting node:sqlite to:", dbPath);
  _nodeDb = new NodeDatabaseWrapper(dbPath);
  return _nodeDb;
}
