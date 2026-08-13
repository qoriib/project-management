import { getDB } from "../index";

export async function resetDatabase(): Promise<void> {
  console.log("Resetting database (deleting all data)...");
  const db = await getDB();
  
  try {
    // Disable foreign key checks temporarily to allow deleting in any order
    await db.execute("PRAGMA foreign_keys = OFF;");
    
    const tables = [
      "delivery_items",
      "deliveries",
      "po_items",
      "purchase_orders",
      "bill_of_materials",
      "project_stages",
      "projects",
      "items",
      "item_categories",
      "units",
      "vendors"
    ];

    for (const table of tables) {
      await db.execute(`DELETE FROM ${table};`);
      // Reset sqlite sequence to reset AUTOINCREMENT if needed
      await db.execute(`DELETE FROM sqlite_sequence WHERE name='${table}';`);
    }

    // Re-enable foreign key checks
    await db.execute("PRAGMA foreign_keys = ON;");
    
    console.log("Database reset successfully.");
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
}
