import * as fs from "node:fs";
import * as path from "node:path";
import { getLocalNodeDb } from "../node-db";

async function runMigrations() {
  const db = getLocalNodeDb(),
    sqlFile = path.resolve(
      __dirname,
      "../../../src-tauri/migrations/001_init.sql",
    ),
    sql = fs.readFileSync(sqlFile, "utf8"),
    statements = sql.split(";").filter((s) => s.trim().length > 0);
  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (error) {
      console.error(
        `Failed to execute: ${statement.substring(0, 50)}...`,
        error,
      );
    }
  }

  console.log("Migrations applied manually.");
}

runMigrations();
