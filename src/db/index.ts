import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { KATEGORI_LABELS, SATUAN_OPTIONS } from "@/utils/formatters";

let _tauriDb: Database | null = null;
let _drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDB() {
  if (_drizzleDb) return _drizzleDb;

  _tauriDb = await Database.load("sqlite:proyek.db");

  _drizzleDb = drizzle(
    async (sql, params, method) => {
      try {
        if (method === "run") {
          const result = await _tauriDb!.execute(sql, params);
          return { rows: [], insertId: result.lastInsertId };
        } else {
          // 'all', 'values', 'get'
          const rows = await _tauriDb!.select<any[]>(sql, params);
          if (method === "values") {
            return { rows: rows.map(Object.values) };
          }
          return { rows };
        }
      } catch (e) {
        console.error("SQLite Proxy Error:", e);
        return { rows: [] };
      }
    },
    { schema }
  );

  await seedDefaults(_drizzleDb);
  return _drizzleDb;
}

async function seedDefaults(db: ReturnType<typeof drizzle<typeof schema>>) {
  // Use raw execution for initial table creation if needed, but since we have migrations, this isn't strictly necessary.
  // However, wait: we deleted migrations! Let's ensure tables exist.
  await _tauriDb!.execute(`
    CREATE TABLE IF NOT EXISTS item_categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_code TEXT UNIQUE NOT NULL,
      category_name TEXT NOT NULL
    )
  `);
  await _tauriDb!.execute(`
    CREATE TABLE IF NOT EXISTS units (
      unit_id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_name TEXT UNIQUE NOT NULL
    )
  `);

  const categoryRows = await db.select().from(schema.itemCategories);
  if (categoryRows.length === 0) {
    const values = Object.entries(KATEGORI_LABELS).map(([code, name]) => ({
      category_code: code,
      category_name: name,
    }));
    if (values.length > 0) {
      await db.insert(schema.itemCategories).values(values).onConflictDoNothing();
    }
  }

  const unitRows = await db.select().from(schema.units);
  if (unitRows.length === 0) {
    const values = SATUAN_OPTIONS.map((name) => ({ unit_name: name }));
    if (values.length > 0) {
      await db.insert(schema.units).values(values).onConflictDoNothing();
    }
  }

  const projectRows = await db.select().from(schema.projects);
  if (projectRows.length === 0) {
    await db.insert(schema.projects).values({
      project_code: "JMS-2026",
      project_name: "PAKET PRESERVASI JALAN MARHEN - SULUSUBAN",
      contractor_name: "CV. GANESHA MANDALA KARIM",
      fiscal_year: 2026,
      status: "ON_PROGRESS",
    });
  }

  const vendorRows = await db.select().from(schema.vendors);
  if (vendorRows.length === 0) {
    await db.insert(schema.vendors).values([
      { vendor_name: "PT. BSBP", vendor_type: "MATERIAL_SUPPLIER", phone: "08123456789", address: "Bandar Lampung" },
      { vendor_name: "PT. BIMA II", vendor_type: "MATERIAL_SUPPLIER", phone: "08234567890", address: "Metro" },
      { vendor_name: "Toko Thomas Jaya", vendor_type: "STORE", phone: "08345678901", address: "Sulusuban" },
      { vendor_name: "PT. ASM", vendor_type: "MATERIAL_SUPPLIER", phone: "08456789012", address: "Bandar Lampung" },
      { vendor_name: "CPAS", vendor_type: "EQUIPMENT_RENTAL", phone: "08567890123", address: "Kotabumi" },
    ]);
  }

  const itemRows = await db.select().from(schema.items);
  if (itemRows.length === 0) {
    await db.insert(schema.items).values([
      { item_code: "AG-BASE-A", item_name: "Agregat Base Course", category: "MATERIAL", unit: "m3" },
      { item_code: "AG-SUB-B", item_name: "Agregat Sub Base", category: "MATERIAL", unit: "m3" },
      { item_code: "BETON-K250", item_name: "Beton FC-20 Mpa (K-250)", category: "BETON", unit: "m3" },
      { item_code: "BETON-K300", item_name: "Beton FC-25 Mpa (K-300)", category: "BETON", unit: "m3" },
      { item_code: "BESI-D13", item_name: "Besi Tulangan D13", category: "MATERIAL", unit: "Kg" },
      { item_code: "BESI-D16", item_name: "Besi Tulangan D16", category: "MATERIAL", unit: "Kg" },
      { item_code: "SOLAR-B35", item_name: "Solar B35", category: "SOLAR", unit: "Liter" },
      { item_code: "SEMEN-PC", item_name: "Semen Portland", category: "MATERIAL", unit: "Sak" },
      { item_code: "PASIR-URUG", item_name: "Pasir Urug", category: "MATERIAL", unit: "m3" },
      { item_code: "BATU-KALI", item_name: "Batu Kali", category: "MATERIAL", unit: "m3" },
      { item_code: "EXCA-PC200", item_name: "Sewa Excavator PC200", category: "ALAT", unit: "Jam" },
      { item_code: "VIBRO-SAKAI", item_name: "Sewa Vibro Sakai CS533", category: "ALAT", unit: "Jam" },
      { item_code: "DUMP-TRUCK", item_name: "Sewa Dump Truck 8m3", category: "ALAT", unit: "Rit" },
    ]);
  }
}
