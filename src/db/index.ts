import Database from "@tauri-apps/plugin-sql";

let _db: Database | null = null;

export async function getDB(): Promise<Database> {
  if (_db) return _db;
  _db = await Database.load("sqlite:proyek.db");
  await seedDefaults(_db);
  return _db;
}

async function seedDefaults(db: Database) {
  // Seed default data is kept in application code; schema is managed by Drizzle migrations.
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
