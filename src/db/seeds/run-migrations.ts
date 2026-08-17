import * as fs from "node:fs";
import * as path from "node:path";
import { getLocalNodeDb } from "../node-db";

async function runMigrations() {
  const db = getLocalNodeDb();
  
  const sqlFile = path.resolve(__dirname, "../../../src-tauri/migrations/001_init.sql");
  const sql = fs.readFileSync(sqlFile, "utf-8");
  
  const statements = sql.split(";").filter(s => s.trim().length > 0);
  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (e) {
      console.error(`Failed to execute: ${statement.substring(0, 50)}...`, e);
    }
  }
  
  console.log("Migrations applied manually.");
}

runMigrations();
