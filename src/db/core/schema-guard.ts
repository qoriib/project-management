/**
 * Schema Guard — Runtime database schema verification and auto-migration.
 *
 * Ensures that the SQLite database has all required tables, columns, and indexes.
 * If an existing client installation has an older schema (e.g. missing `has_detail`
 * on `requirement_groups`, missing `note` on `item_prices`, etc.), this guard
 * safely applies the necessary `ALTER TABLE` statements without data loss.
 */

export interface DatabaseExecutor {
  select<T>(sql: string, params?: any[]): Promise<T>;
  execute(sql: string, params?: any[]): Promise<any>;
}

interface ColumnPatch {
  name: string;
  alterSql: string;
}

interface TableDefinition {
  createSql: string;
  columns: ColumnPatch[];
}

const REQUIRED_TABLES: Record<string, TableDefinition> = {
  projects: {
    createSql: `CREATE TABLE IF NOT EXISTS \`projects\` (
      \`project_id\` text NOT NULL PRIMARY KEY,
      \`project_name\` text NOT NULL,
      \`company_name\` text NOT NULL,
      \`fiscal_year\` integer NOT NULL,
      \`requirements_is_approved\` integer DEFAULT 0,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime'))
    );`,
    columns: [
      {
        name: "requirements_is_approved",
        alterSql: "ALTER TABLE `projects` ADD COLUMN `requirements_is_approved` integer DEFAULT 0;",
      },
      {
        name: "created_at",
        alterSql: "ALTER TABLE `projects` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `projects` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  vendors: {
    createSql: `CREATE TABLE IF NOT EXISTS \`vendors\` (
      \`vendor_id\` text NOT NULL PRIMARY KEY,
      \`vendor_name\` text NOT NULL,
      \`phone\` text,
      \`address\` text,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime'))
    );`,
    columns: [
      { name: "phone", alterSql: "ALTER TABLE `vendors` ADD COLUMN `phone` text;" },
      { name: "address", alterSql: "ALTER TABLE `vendors` ADD COLUMN `address` text;" },
      {
        name: "created_at",
        alterSql: "ALTER TABLE `vendors` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `vendors` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  item_categories: {
    createSql: `CREATE TABLE IF NOT EXISTS \`item_categories\` (
      \`category_id\` text NOT NULL PRIMARY KEY,
      \`prefix\` text NOT NULL,
      \`category_code\` text NOT NULL,
      \`category_name\` text NOT NULL,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime'))
    );`,
    columns: [
      {
        name: "created_at",
        alterSql: "ALTER TABLE `item_categories` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `item_categories` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  units: {
    createSql: `CREATE TABLE IF NOT EXISTS \`units\` (
      \`unit_id\` text NOT NULL PRIMARY KEY,
      \`unit_name\` text NOT NULL,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime'))
    );`,
    columns: [
      {
        name: "created_at",
        alterSql: "ALTER TABLE `units` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `units` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  items: {
    createSql: `CREATE TABLE IF NOT EXISTS \`items\` (
      \`item_id\` text NOT NULL PRIMARY KEY,
      \`item_code\` text NOT NULL,
      \`item_name\` text NOT NULL,
      \`category_id\` text NOT NULL,
      \`unit_id\` text NOT NULL,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (\`category_id\`) REFERENCES \`item_categories\`(\`category_id\`) ON UPDATE no action ON DELETE restrict,
      FOREIGN KEY (\`unit_id\`) REFERENCES \`units\`(\`unit_id\`) ON UPDATE no action ON DELETE restrict
    );`,
    columns: [
      {
        name: "created_at",
        alterSql: "ALTER TABLE `items` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `items` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  item_prices: {
    createSql: `CREATE TABLE IF NOT EXISTS \`item_prices\` (
      \`item_price_id\` text NOT NULL PRIMARY KEY,
      \`item_id\` text NOT NULL,
      \`price\` real NOT NULL,
      \`note\` text DEFAULT NULL,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (\`item_id\`) REFERENCES \`items\`(\`item_id\`) ON UPDATE no action ON DELETE cascade
    );`,
    columns: [
      { name: "note", alterSql: "ALTER TABLE `item_prices` ADD COLUMN `note` text DEFAULT NULL;" },
      {
        name: "created_at",
        alterSql: "ALTER TABLE `item_prices` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `item_prices` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  requirement_groups: {
    createSql: `CREATE TABLE IF NOT EXISTS \`requirement_groups\` (
      \`requirement_group_id\` text NOT NULL PRIMARY KEY,
      \`project_id\` text NOT NULL,
      \`group_name\` text NOT NULL,
      \`has_detail\` integer NOT NULL DEFAULT 0,
      \`budget\` real DEFAULT NULL,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`project_id\`) ON UPDATE no action ON DELETE cascade
    );`,
    columns: [
      {
        name: "has_detail",
        alterSql: "ALTER TABLE `requirement_groups` ADD COLUMN `has_detail` integer NOT NULL DEFAULT 0;",
      },
      { name: "budget", alterSql: "ALTER TABLE `requirement_groups` ADD COLUMN `budget` real DEFAULT NULL;" },
      {
        name: "created_at",
        alterSql:
          "ALTER TABLE `requirement_groups` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql:
          "ALTER TABLE `requirement_groups` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  requirements: {
    createSql: `CREATE TABLE IF NOT EXISTS \`requirements\` (
      \`requirement_id\` text NOT NULL PRIMARY KEY,
      \`project_id\` text NOT NULL,
      \`requirement_group_id\` text,
      \`item_id\` text NOT NULL,
      \`item_price_id\` text NOT NULL,
      \`qty\` real NOT NULL,
      \`has_tax\` integer DEFAULT 0,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`project_id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`requirement_group_id\`) REFERENCES \`requirement_groups\`(\`requirement_group_id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`item_id\`) REFERENCES \`items\`(\`item_id\`) ON UPDATE no action ON DELETE restrict,
      FOREIGN KEY (\`item_price_id\`) REFERENCES \`item_prices\`(\`item_price_id\`) ON UPDATE no action ON DELETE restrict
    );`,
    columns: [
      {
        name: "requirement_group_id",
        alterSql:
          "ALTER TABLE `requirements` ADD COLUMN `requirement_group_id` text REFERENCES `requirement_groups`(`requirement_group_id`) ON UPDATE no action ON DELETE set null;",
      },
      { name: "has_tax", alterSql: "ALTER TABLE `requirements` ADD COLUMN `has_tax` integer DEFAULT 0;" },
      {
        name: "created_at",
        alterSql: "ALTER TABLE `requirements` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `requirements` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  orders: {
    createSql: `CREATE TABLE IF NOT EXISTS \`orders\` (
      \`order_id\` text NOT NULL PRIMARY KEY,
      \`project_id\` text NOT NULL,
      \`order_code\` text,
      \`order_date\` text NOT NULL,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`project_id\`) ON UPDATE no action ON DELETE cascade
    );`,
    columns: [
      {
        name: "created_at",
        alterSql: "ALTER TABLE `orders` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `orders` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  order_items: {
    createSql: `CREATE TABLE IF NOT EXISTS \`order_items\` (
      \`order_item_id\` text NOT NULL PRIMARY KEY,
      \`order_id\` text NOT NULL,
      \`requirement_group_id\` text,
      \`item_id\` text NOT NULL,
      \`vendor_id\` text NOT NULL,
      \`item_price_id\` text NOT NULL,
      \`qty\` real NOT NULL,
      \`has_tax\` integer DEFAULT 0,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`order_id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`requirement_group_id\`) REFERENCES \`requirement_groups\`(\`requirement_group_id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`item_id\`) REFERENCES \`items\`(\`item_id\`) ON UPDATE no action ON DELETE restrict,
      FOREIGN KEY (\`vendor_id\`) REFERENCES \`vendors\`(\`vendor_id\`) ON UPDATE no action ON DELETE restrict,
      FOREIGN KEY (\`item_price_id\`) REFERENCES \`item_prices\`(\`item_price_id\`) ON UPDATE no action ON DELETE restrict
    );`,
    columns: [
      {
        name: "requirement_group_id",
        alterSql:
          "ALTER TABLE `order_items` ADD COLUMN `requirement_group_id` text REFERENCES `requirement_groups`(`requirement_group_id`) ON UPDATE no action ON DELETE set null;",
      },
      { name: "has_tax", alterSql: "ALTER TABLE `order_items` ADD COLUMN `has_tax` integer DEFAULT 0;" },
      {
        name: "created_at",
        alterSql: "ALTER TABLE `order_items` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `order_items` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  receipts: {
    createSql: `CREATE TABLE IF NOT EXISTS \`receipts\` (
      \`receipt_id\` text NOT NULL PRIMARY KEY,
      \`order_id\` text NOT NULL,
      \`receipt_code\` text,
      \`receipt_date\` text NOT NULL,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`order_id\`) ON UPDATE no action ON DELETE cascade
    );`,
    columns: [
      {
        name: "created_at",
        alterSql: "ALTER TABLE `receipts` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `receipts` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
  receipt_items: {
    createSql: `CREATE TABLE IF NOT EXISTS \`receipt_items\` (
      \`receipt_item_id\` text NOT NULL PRIMARY KEY,
      \`receipt_id\` text NOT NULL,
      \`order_item_id\` text NOT NULL,
      \`item_price_id\` text NOT NULL,
      \`qty\` real NOT NULL,
      \`has_tax\` integer DEFAULT 0,
      \`created_at\` text DEFAULT (datetime('now', 'localtime')),
      \`updated_at\` text DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (\`receipt_id\`) REFERENCES \`receipts\`(\`receipt_id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`order_item_id\`) REFERENCES \`order_items\`(\`order_item_id\`) ON UPDATE no action ON DELETE restrict,
      FOREIGN KEY (\`item_price_id\`) REFERENCES \`item_prices\`(\`item_price_id\`) ON UPDATE no action ON DELETE restrict
    );`,
    columns: [
      {
        name: "item_price_id",
        alterSql:
          "ALTER TABLE `receipt_items` ADD COLUMN `item_price_id` text REFERENCES `item_prices`(`item_price_id`) ON UPDATE no action ON DELETE restrict;",
      },
      { name: "has_tax", alterSql: "ALTER TABLE `receipt_items` ADD COLUMN `has_tax` integer DEFAULT 0;" },
      {
        name: "created_at",
        alterSql: "ALTER TABLE `receipt_items` ADD COLUMN `created_at` text DEFAULT (datetime('now', 'localtime'));",
      },
      {
        name: "updated_at",
        alterSql: "ALTER TABLE `receipt_items` ADD COLUMN `updated_at` text DEFAULT (datetime('now', 'localtime'));",
      },
    ],
  },
};

const REQUIRED_INDEXES: string[] = [
  "CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);",
  "CREATE INDEX IF NOT EXISTS idx_items_unit_id ON items(unit_id);",
  "CREATE INDEX IF NOT EXISTS idx_item_prices_item_id ON item_prices(item_id);",
  "CREATE INDEX IF NOT EXISTS idx_requirement_groups_project_id ON requirement_groups(project_id);",
  "CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON requirements(project_id);",
  "CREATE INDEX IF NOT EXISTS idx_requirements_group_id ON requirements(requirement_group_id);",
  "CREATE INDEX IF NOT EXISTS idx_requirements_item_id ON requirements(item_id);",
  "CREATE INDEX IF NOT EXISTS idx_requirements_item_price_id ON requirements(item_price_id);",
  "CREATE INDEX IF NOT EXISTS idx_orders_project_id ON orders(project_id);",
  "CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_group_id ON order_items(requirement_group_id);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_item_id ON order_items(item_id);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);",
  "CREATE INDEX IF NOT EXISTS idx_order_items_item_price_id ON order_items(item_price_id);",
  "CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);",
  "CREATE INDEX IF NOT EXISTS idx_receipts_receipt_date ON receipts(receipt_date);",
  "CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);",
  "CREATE INDEX IF NOT EXISTS idx_receipt_items_order_item_id ON receipt_items(order_item_id);",
  "CREATE INDEX IF NOT EXISTS idx_receipt_items_item_price_id ON receipt_items(item_price_id);",
];

let isSchemaEnsured = false;

/**
 * Checks all tables in the SQLite database and safely applies missing columns and indexes.
 * Runs once per application lifecycle or explicitly after database reset.
 */
export async function ensureSchemaCompatibility(db: DatabaseExecutor, force = false): Promise<void> {
  if (isSchemaEnsured && !force) {
    return;
  }

  try {
    // 1. Fetch all existing tables
    const tableRows = await db.select<Array<{ name: string }>>("SELECT name FROM sqlite_master WHERE type='table';");
    const existingTables = new Set(tableRows.map((t) => t.name.toLowerCase()));

    // 2. Iterate through each required table
    for (const [tableName, tableDef] of Object.entries(REQUIRED_TABLES)) {
      if (!existingTables.has(tableName.toLowerCase())) {
        // Table doesn't exist yet, create it
        await db.execute(tableDef.createSql);
      } else {
        // Table exists, verify and patch any missing columns
        const colRows = await db.select<Array<{ name: string }>>(`PRAGMA table_info(\`${tableName}\`);`);
        const existingCols = new Set(colRows.map((c) => c.name.toLowerCase()));

        for (const col of tableDef.columns) {
          if (!existingCols.has(col.name.toLowerCase())) {
            try {
              await db.execute(col.alterSql);
            } catch (alterError) {
              console.warn(
                `[SchemaGuard] Note: Failed to alter ${tableName}.${col.name} (might already exist):`,
                alterError,
              );
            }
          }
        }
      }
    }

    // 3. Backfill receipt_items.item_price_id if any row has it as NULL
    try {
      await db.execute(`
        UPDATE receipt_items
        SET item_price_id = (
          SELECT item_price_id FROM order_items
          WHERE order_items.order_item_id = receipt_items.order_item_id
        )
        WHERE item_price_id IS NULL;
      `);
    } catch {
      // Ignore if order_items or receipt_items is empty
    }

    // 4. Ensure all indexes exist
    for (const indexSql of REQUIRED_INDEXES) {
      try {
        await db.execute(indexSql);
      } catch (indexError) {
        console.warn("[SchemaGuard] Note: Index creation warning:", indexError);
      }
    }

    isSchemaEnsured = true;
  } catch (error) {
    console.error("[SchemaGuard] Fatal error ensuring schema compatibility:", error);
    throw error;
  }
}
