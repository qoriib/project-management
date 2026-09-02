/**
 * Database Service — Administrative database operations.
 *
 * Provides ORM-level database reset using soft deletes,
 * safely bypassing and respecting SQLite triggers and constraints.
 */

import { getDB } from "@/db/index";
import { dbLog } from "@/db/core/db-logger";
import { wrapDbError } from "@/db/core/errors";

/**
 * Resets all application data at the ORM level by performing a clean hard wipe
 * of all entity tables, while everyday CRUD operations continue to use soft delete.
 *
 * Execution Steps:
 * 1. Temporarily turns off foreign keys to allow bulk table clearing without constraint order conflicts.
 * 2. Unlocks any approved projects (`requirements_is_approved = 0`) to prevent SQLite trigger aborts.
 * 3. Deletes all rows from all application tables.
 * 4. Re-enables foreign keys and runs VACUUM to reclaim disk space.
 */
export async function resetDatabase(): Promise<void> {
  dbLog.info("[DatabaseService] Starting database reset (clean hard wipe)...");
  try {
    const db = await getDB();

    // 1. Disable foreign keys temporarily for clean wipe
    await db.execute("PRAGMA foreign_keys = OFF;");

    // Unlock projects to avoid requirement triggers
    await db.execute("UPDATE projects SET requirements_is_approved = 0 WHERE requirements_is_approved = 1;");

    // 2. Clear all tables
    const tables = [
      "receipt_items",
      "receipts",
      "order_items",
      "orders",
      "requirements",
      "item_prices",
      "items",
      "item_categories",
      "units",
      "vendors",
      "projects",
    ];

    for (const table of tables) {
      await db.execute(`DELETE FROM ${table};`);
      dbLog.debug(`[DatabaseService] Cleared table '${table}'`);
    }

    // 3. Re-enable foreign keys and run VACUUM
    await db.execute("PRAGMA foreign_keys = ON;");
    await db.execute("VACUUM;");

    dbLog.info("[DatabaseService] Database reset (clean wipe) completed successfully.");
  } catch (error) {
    dbLog.error(`[DatabaseService] Database reset ERROR: ${(error as Error)?.message ?? String(error)}`);
    throw wrapDbError(error, "database_reset");
  }
}
