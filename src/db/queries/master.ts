import { getDB } from "@/db/index";
import type { Project, Vendor, Item, ItemCategory, Unit, ItemPrice } from "@/db/schema";
export type { Project, Vendor, Item, ItemCategory, Unit, ItemPrice };

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
    `INSERT INTO projects (project_name, company_name, fiscal_year) 
     VALUES ($1, $2, $3)`,
    [data.project_name, data.company_name, data.fiscal_year]
  );
}

export async function updateProject(
  id: number,
  data: Partial<Omit<Project, "project_id" | "created_at">>
): Promise<void> {
  const db = await getDB();
  
  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  if (updates.length === 0) return;

  params.push(id);
  await db.execute(
    `UPDATE projects SET ${updates.join(", ")} WHERE project_id = $${paramIdx}`,
    params
  );
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM projects WHERE project_id = $1", [id]);
}

// ── Vendors ──────────────────────────────────────────────────────────────────

export async function getVendors(): Promise<Vendor[]> {
  const db = await getDB();
  return db.select<Vendor[]>("SELECT * FROM vendors ORDER BY vendor_name ASC");
}

export async function createVendor(
  data: Omit<Vendor, "vendor_id" | "created_at">
): Promise<void> {
  const db = await getDB();
  await db.execute(
    `INSERT INTO vendors (vendor_name, phone, address) VALUES ($1, $2, $3)`,
    [data.vendor_name, data.phone ?? null, data.address ?? null]
  );
}

export async function updateVendor(id: number, data: Partial<Omit<Vendor, "vendor_id" | "created_at">>): Promise<void> {
  const db = await getDB();
  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  if (updates.length === 0) return;

  params.push(id);
  await db.execute(`UPDATE vendors SET ${updates.join(", ")} WHERE vendor_id = $${paramIdx}`, params);
}

export async function deleteVendor(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM vendors WHERE vendor_id = $1", [id]);
}

// ── Items (Catalog) ──────────────────────────────────────────────────────────

export async function getItems(): Promise<Item[]> {
  const db = await getDB();
  return db.select<Item[]>("SELECT * FROM items ORDER BY category ASC, item_name ASC");
}

export async function createItem(data: Omit<Item, "item_id">): Promise<number> {
  const db = await getDB();
  const res = await db.execute(
    `INSERT INTO items (item_name, category, unit) VALUES ($1, $2, $3)`,
    [data.item_name, data.category, data.unit]
  );
  return res.lastInsertId as number;
}

export async function updateItem(id: number, data: Partial<Omit<Item, "item_id">>): Promise<void> {
  const db = await getDB();
  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  if (updates.length === 0) return;

  params.push(id);
  await db.execute(`UPDATE items SET ${updates.join(", ")} WHERE item_id = $${paramIdx}`, params);
}

export async function deleteItem(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM items WHERE item_id = $1", [id]);
}

// ── Item Prices ───────────────────────────────────────────────────────────────

export async function getItemPrices(itemId: number): Promise<ItemPrice[]> {
  const db = await getDB();
  return db.select<ItemPrice[]>(
    "SELECT * FROM item_prices WHERE item_id = $1 ORDER BY price_id ASC",
    [itemId]
  );
}

export async function saveItemPrices(itemId: number, prices: { price: number }[]): Promise<void> {
  const db = await getDB();
  
  // Hapus semua harga sebelumnya untuk item ini
  await db.execute("DELETE FROM item_prices WHERE item_id = $1", [itemId]);
  
  // Masukkan harga baru
  for (const price of prices) {
    await db.execute(
      `INSERT INTO item_prices (item_id, price) VALUES ($1, $2)`,
      [itemId, price.price]
    );
  }
}

// ── Item Categories ──────────────────────────────────────────────────────────

export async function getItemCategories(): Promise<ItemCategory[]> {
  const db = await getDB();
  return db.select<ItemCategory[]>("SELECT * FROM item_categories ORDER BY category_name ASC");
}

export async function createItemCategory(data: Omit<ItemCategory, "category_id">): Promise<void> {
  const db = await getDB();
  await db.execute(
    `INSERT INTO item_categories (category_name) VALUES ($1)`,
    [data.category_name]
  );
}

export async function updateItemCategory(id: number, data: Partial<Omit<ItemCategory, "category_id">>): Promise<void> {
  const db = await getDB();
  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  if (updates.length === 0) return;

  params.push(id);
  await db.execute(`UPDATE item_categories SET ${updates.join(", ")} WHERE category_id = $${paramIdx}`, params);
}

export async function deleteItemCategory(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM item_categories WHERE category_id = $1", [id]);
}

// ── Units ────────────────────────────────────────────────────────────────────

export async function getUnits(): Promise<Unit[]> {
  const db = await getDB();
  return db.select<Unit[]>("SELECT * FROM units ORDER BY unit_name ASC");
}

export async function createUnit(data: Omit<Unit, "unit_id">): Promise<void> {
  const db = await getDB();
  await db.execute(
    `INSERT INTO units (unit_name) VALUES ($1)`,
    [data.unit_name]
  );
}

export async function updateUnit(id: number, data: Partial<Omit<Unit, "unit_id">>): Promise<void> {
  const db = await getDB();
  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  if (updates.length === 0) return;

  params.push(id);
  await db.execute(`UPDATE units SET ${updates.join(", ")} WHERE unit_id = $${paramIdx}`, params);
}

export async function deleteUnit(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM units WHERE unit_id = $1", [id]);
}
