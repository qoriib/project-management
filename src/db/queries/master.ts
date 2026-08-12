import { getDB } from "@/db/index";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Project {
  project_id: number;
  project_code: string;
  project_name: string;
  contractor_name: string;
  fiscal_year: number;
  status: "ON_PROGRESS" | "COMPLETED" | "SUSPENDED";
  created_at: string;
}

export interface Vendor {
  vendor_id: number;
  vendor_name: string;
  vendor_type: "MATERIAL_SUPPLIER" | "EQUIPMENT_RENTAL" | "STORE";
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Item {
  item_id: number;
  item_code?: string;
  item_name: string;
  category: "MATERIAL" | "ALAT" | "BETON" | "SOLAR" | "ATK/K3";
  unit: string;
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.select<Project[]>("SELECT * FROM projects ORDER BY created_at DESC");
}

export async function createProject(
  data: Omit<Project, "project_id" | "created_at">
): Promise<void> {
  const db = await getDB();
  await db.execute(
    "INSERT INTO projects (project_code, project_name, contractor_name, fiscal_year, status) VALUES (?, ?, ?, ?, ?)",
    [data.project_code, data.project_name, data.contractor_name, data.fiscal_year, data.status || 'ON_PROGRESS']
  );
}

export async function updateProject(
  id: number,
  data: Partial<Omit<Project, "project_id" | "created_at">>
): Promise<void> {
  const db = await getDB();
  await db.execute(
    `UPDATE projects SET
      project_code = COALESCE(?, project_code),
      project_name = COALESCE(?, project_name),
      contractor_name = COALESCE(?, contractor_name),
      fiscal_year = COALESCE(?, fiscal_year),
      status = COALESCE(?, status)
     WHERE project_id = ?`,
    [data.project_code ?? null, data.project_name ?? null, data.contractor_name ?? null, data.fiscal_year ?? null, data.status ?? null, id]
  );
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM projects WHERE project_id = ?", [id]);
}

// ── Vendors ──────────────────────────────────────────────────────────────────

export async function getVendors(): Promise<Vendor[]> {
  const db = await getDB();
  return db.select<Vendor[]>("SELECT * FROM vendors ORDER BY vendor_name");
}

export async function createVendor(
  data: Omit<Vendor, "vendor_id" | "created_at">
): Promise<void> {
  const db = await getDB();
  await db.execute(
    "INSERT INTO vendors (vendor_name, vendor_type, phone, address) VALUES (?, ?, ?, ?)",
    [data.vendor_name, data.vendor_type, data.phone ?? null, data.address ?? null]
  );
}

export async function updateVendor(id: number, data: Partial<Omit<Vendor, "vendor_id" | "created_at">>): Promise<void> {
  const db = await getDB();
  await db.execute(
    `UPDATE vendors SET
      vendor_name = COALESCE(?, vendor_name),
      vendor_type = COALESCE(?, vendor_type),
      phone = ?,
      address = ?
     WHERE vendor_id = ?`,
    [data.vendor_name ?? null, data.vendor_type ?? null, data.phone ?? null, data.address ?? null, id]
  );
}

export async function deleteVendor(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM vendors WHERE vendor_id = ?", [id]);
}

// ── Items (Catalog) ──────────────────────────────────────────────────────────

export async function getItems(): Promise<Item[]> {
  const db = await getDB();
  return db.select<Item[]>("SELECT * FROM items ORDER BY category, item_name");
}

export async function createItem(data: Omit<Item, "item_id">): Promise<void> {
  const db = await getDB();
  await db.execute(
    "INSERT INTO items (item_code, item_name, category, unit) VALUES (?, ?, ?, ?)",
    [data.item_code ?? null, data.item_name, data.category, data.unit]
  );
}

export async function updateItem(id: number, data: Partial<Omit<Item, "item_id">>): Promise<void> {
  const db = await getDB();
  await db.execute(
    `UPDATE items SET
      item_code = ?,
      item_name = COALESCE(?, item_name),
      category = COALESCE(?, category),
      unit = COALESCE(?, unit)
     WHERE item_id = ?`,
    [data.item_code ?? null, data.item_name ?? null, data.category ?? null, data.unit ?? null, id]
  );
}

export async function deleteItem(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM items WHERE item_id = ?", [id]);
}
