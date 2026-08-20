import { getDB } from "../index";
import { getDbPath } from "../node-db";
import * as fs from "node:fs";
import * as path from "node:path";

export async function resetDatabase(): Promise<void> {
  console.log("Resetting database (deleting all data)...");

  let fileDeleted = false;

  try {
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) {
      console.log(`Deleting SQLite file physically at: ${dbPath}`);
      try {
        fs.unlinkSync(dbPath);
        fileDeleted = true;
        console.log("Database file deleted.");
      } catch (e: any) {
        console.warn("Could not delete DB file (it might be in use):", e.message);
      }
    }
  } catch (err) {
    console.warn("Error finding DB path:", err);
  }

  const db = await getDB();

  try {
    if (fileDeleted) {
      console.log("Recreating schema from migrations...");
      const initSqlPath = path.resolve(process.cwd(), "src-tauri", "migrations", "001_init.sql");
      const initSql = fs.readFileSync(initSqlPath, "utf8");

      // Run the entire script using exec to handle triggers properly
      await (db as any).exec(initSql);
      console.log("Schema recreated successfully.");
    }

    // We also execute DELETE on tables in case Tauri plugin sql recreating doesn't drop properly
    // but typically dropping the file is enough.
    await db.execute("PRAGMA foreign_keys = OFF;");

    const tables = [
      "receipt_items",
      "receipts",
      "order_items",
      "orders",
      "requirements",
      "projects",
      "item_prices",
      "items",
      "item_categories",
      "units",
      "vendors",
    ];

    for (const table of tables) {
      try {
        await db.execute(`DELETE FROM ${table};`);
      } catch {
        // table may not exist yet if schema hasn't migrated — skip silently
      }
    }

    // Re-enable foreign key checks
    await db.execute("PRAGMA foreign_keys = ON;");

    console.log("Database reset successfully.");
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
}
