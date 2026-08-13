import Database from "@tauri-apps/plugin-sql";

let _tauriDb: Database | null = null;

export async function getDB(): Promise<Database> {
  if (_tauriDb) return _tauriDb;

  _tauriDb = await Database.load("sqlite:proyek.dbproyek_v6_1.db");

  return _tauriDb;
}
