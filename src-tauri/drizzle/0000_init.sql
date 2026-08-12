PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  project_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  status TEXT DEFAULT 'ON_PROGRESS',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS vendors (
  vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_name TEXT UNIQUE NOT NULL,
  vendor_type TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS items (
  item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_code TEXT UNIQUE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  po_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
  vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
  po_number TEXT UNIQUE NOT NULL,
  po_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

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
);

CREATE TABLE IF NOT EXISTS deliveries (
  delivery_id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_item_id INTEGER REFERENCES po_items(po_item_id) ON DELETE CASCADE,
  delivery_date TEXT NOT NULL,
  delivered_volume REAL NOT NULL,
  delivery_note_number TEXT,
  location_destination TEXT,
  notes TEXT
);

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
);

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
);

CREATE TABLE IF NOT EXISTS invoice_items (
  inv_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  po_item_id INTEGER REFERENCES po_items(po_item_id) ON DELETE SET NULL,
  equip_log_id INTEGER REFERENCES equipment_logs(equip_log_id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL
);