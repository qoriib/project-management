import Database from "@tauri-apps/plugin-sql";

let _db: Database | null = null;

export async function getDB(): Promise<Database> {
  if (_db) return _db;
  _db = await Database.load("sqlite:proyek.db");
  await initSchema(_db);
  return _db;
}

async function initSchema(db: Database) {
  // Enable foreign keys
  await db.execute("PRAGMA foreign_keys = ON;");

  // 1. Projects
  await db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT UNIQUE NOT NULL,
      project_name TEXT NOT NULL,
      contractor_name TEXT NOT NULL,
      fiscal_year INTEGER NOT NULL,
      status TEXT DEFAULT 'ON_PROGRESS',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 2. Vendors
  await db.execute(`
    CREATE TABLE IF NOT EXISTS vendors (
      vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_name TEXT UNIQUE NOT NULL,
      vendor_type TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 3. Items (Catalog)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS items (
      item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_code TEXT UNIQUE,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL
    )
  `);

  // 4. Purchase Orders
  await db.execute(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      po_id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
      vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
      po_number TEXT UNIQUE NOT NULL,
      po_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 5. PO Items
  await db.execute(`
    CREATE TABLE IF NOT EXISTS po_items (
      po_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
      item_id INTEGER REFERENCES items(item_id) ON DELETE RESTRICT,
      ordered_volume REAL NOT NULL,
      unit_price REAL NOT NULL,
      subtotal_price REAL GENERATED ALWAYS AS (ordered_volume * unit_price) STORED,
      ppn_percentage REAL DEFAULT 0.00,
      ppn_amount REAL GENERATED ALWAYS AS (ordered_volume * unit_price * (ppn_percentage / 100.0)) STORED,
      total_price REAL GENERATED ALWAYS AS (ordered_volume * unit_price * (1.0 + ppn_percentage / 100.0)) STORED
    )
  `);

  // 6. Deliveries
  await db.execute(`
    CREATE TABLE IF NOT EXISTS deliveries (
      delivery_id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_item_id INTEGER REFERENCES po_items(po_item_id) ON DELETE CASCADE,
      delivery_date TEXT NOT NULL,
      delivered_volume REAL NOT NULL,
      delivery_note_number TEXT,
      location_destination TEXT,
      notes TEXT
    )
  `);

  // 7. Equipment Logs
  await db.execute(`
    CREATE TABLE IF NOT EXISTS equipment_logs (
      equip_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(project_id) ON DELETE SET NULL,
      vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE SET NULL,
      equipment_name TEXT NOT NULL,
      operator_name TEXT,
      work_date_start TEXT NOT NULL,
      work_date_end TEXT,
      duration_value REAL NOT NULL,
      duration_unit TEXT NOT NULL,
      rate_per_unit REAL NOT NULL,
      total_cost REAL GENERATED ALWAYS AS (duration_value * rate_per_unit) STORED,
      activity_description TEXT
    )
  `);

  // 8. Invoices
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(project_id) ON DELETE SET NULL,
      vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
      invoice_number TEXT UNIQUE,
      invoice_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0.00,
      remaining_balance REAL GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
      payment_status TEXT DEFAULT 'UNPAID',
      ownership_type TEXT DEFAULT 'INTERNAL',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 9. Invoice Items
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      inv_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER REFERENCES invoices(invoice_id) ON DELETE CASCADE,
      po_item_id INTEGER REFERENCES po_items(po_item_id) ON DELETE SET NULL,
      equip_log_id INTEGER REFERENCES equipment_logs(equip_log_id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL
    )
  `);

  // 10. View
  await db.execute(`
    CREATE VIEW IF NOT EXISTS view_po_delivery_summary AS
    SELECT 
        p.project_name,
        po.po_number,
        v.vendor_name,
        i.item_name,
        poi.ordered_volume AS volume_po,
        COALESCE(SUM(d.delivered_volume), 0) AS total_volume_terkirim,
        (poi.ordered_volume - COALESCE(SUM(d.delivered_volume), 0)) AS sisa_volume_kontrak,
        i.unit
    FROM po_items poi
    JOIN purchase_orders po ON poi.po_id = po.po_id
    JOIN projects p ON po.project_id = p.project_id
    JOIN vendors v ON po.vendor_id = v.vendor_id
    JOIN items i ON poi.item_id = i.item_id
    LEFT JOIN deliveries d ON poi.po_item_id = d.po_item_id
    GROUP BY poi.po_item_id;
  `);

  // Seed default data
  await seedDefaults(db);
}

async function seedDefaults(db: Database) {
  const projects = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM projects");
  if (projects[0].count === 0) {
    await db.execute(`
      INSERT INTO projects (project_code, project_name, contractor_name, fiscal_year, status) VALUES
        ('JMS-2026', 'PAKET PRESERVASI JALAN MARHEN - SULUSUBAN', 'CV. GANESHA MANDALA KARIM', 2026, 'ON_PROGRESS')
    `);
  }

  const vendors = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM vendors");
  if (vendors[0].count === 0) {
    await db.execute(`
      INSERT INTO vendors (vendor_name, vendor_type, phone, address) VALUES
        ('PT. BSBP', 'MATERIAL_SUPPLIER', '08123456789', 'Bandar Lampung'),
        ('PT. BIMA II', 'MATERIAL_SUPPLIER', '08234567890', 'Metro'),
        ('Toko Thomas Jaya', 'STORE', '08345678901', 'Sulusuban'),
        ('PT. ASM', 'MATERIAL_SUPPLIER', '08456789012', 'Bandar Lampung'),
        ('CPAS', 'EQUIPMENT_RENTAL', '08567890123', 'Kotabumi')
    `);
  }

  const items = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM items");
  if (items[0].count === 0) {
    await db.execute(`
      INSERT INTO items (item_code, item_name, category, unit) VALUES
        ('AG-BASE-A', 'Agregat Base Course', 'MATERIAL', 'm3'),
        ('AG-SUB-B', 'Agregat Sub Base', 'MATERIAL', 'm3'),
        ('BETON-K250', 'Beton FC-20 Mpa (K-250)', 'BETON', 'm3'),
        ('BETON-K300', 'Beton FC-25 Mpa (K-300)', 'BETON', 'm3'),
        ('BESI-D13', 'Besi Tulangan D13', 'MATERIAL', 'Kg'),
        ('BESI-D16', 'Besi Tulangan D16', 'MATERIAL', 'Kg'),
        ('SOLAR-B35', 'Solar B35', 'SOLAR', 'Liter'),
        ('SEMEN-PC', 'Semen Portland', 'MATERIAL', 'Sak'),
        ('PASIR-URUG', 'Pasir Urug', 'MATERIAL', 'm3'),
        ('BATU-KALI', 'Batu Kali', 'MATERIAL', 'm3'),
        ('EXCA-PC200', 'Sewa Excavator PC200', 'ALAT', 'Jam'),
        ('VIBRO-SAKAI', 'Sewa Vibro Sakai CS533', 'ALAT', 'Jam'),
        ('DUMP-TRUCK', 'Sewa Dump Truck 8m3', 'ALAT', 'Rit')
    `);
  }
}
