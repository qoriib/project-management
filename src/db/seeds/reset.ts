import { getDB } from "../index";

export async function resetDatabase(): Promise<void> {
  console.log("Resetting database (deleting all data)...");
  const db = await getDB();

  try {
    // Disable foreign key checks temporarily to allow deleting in any order
    await db.execute("PRAGMA foreign_keys = OFF;");

    const tables = [
      "receipt_items",
      "receipts",
      "order_items",
      "orders",
      "requirements",
      // legacy names in case schema hasn't migrated yet
      "delivery_items",
      "deliveries",
      "po_items",
      "purchase_orders",
      "bill_of_materials",
      "bom_groups",
      // shared tables
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
