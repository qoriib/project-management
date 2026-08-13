import { getDB } from "@/db/index";
import type { Project, Vendor, Item, ItemCategory, Unit, ItemPrice } from "@/db/schema";
export type { Project, Vendor, Item, ItemCategory, Unit, ItemPrice };

// ── Projects ─────────────────────────────────────────────────────────────────

export type ProjectWithStages = Project & { stages: string[] };

export async function getProjects(): Promise<ProjectWithStages[]> {
  const db = await getDB();
  const projects = await db.select<Project[]>("SELECT * FROM projects ORDER BY created_at DESC");
  const stages = await db.select<{ project_id: number; stage_name: string }[]>("SELECT project_id, stage_name FROM project_stages");
  
  return projects.map(proj => ({
    ...proj,
    stages: stages.filter(s => s.project_id === proj.project_id).map(s => s.stage_name)
  }));
}

export async function createProject(
  data: Omit<Project, "project_id" | "created_at">
): Promise<number> {
  const db = await getDB();
  const res = await db.execute(
    `INSERT INTO projects (project_name, company_name, fiscal_year) 
     VALUES ($1, $2, $3)`,
    [data.project_name, data.company_name, data.fiscal_year]
  );
  return res.lastInsertId as number;
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

export async function getProjectStagesWithRelation(projectId: number): Promise<{ stage_id: number; stage_name: string; has_relation: boolean }[]> {
  const db = await getDB();
  const stages = await db.select<{ stage_id: number; stage_name: string; count: number }[]>(
    `SELECT s.stage_id, s.stage_name, COUNT(b.bom_id) as count 
     FROM project_stages s 
     LEFT JOIN bill_of_materials b ON s.stage_id = b.stage_id 
     WHERE s.project_id = $1 
     GROUP BY s.stage_id`,
    [projectId]
  );
  return stages.map(s => ({
    stage_id: s.stage_id,
    stage_name: s.stage_name,
    has_relation: s.count > 0
  }));
}

export async function saveProjectStages(projectId: number, stages: { stage_id?: number, stage_name: string }[]): Promise<void> {
  const db = await getDB();
  const existing = await db.select<{ stage_id: number }[]>("SELECT stage_id FROM project_stages WHERE project_id = $1", [projectId]);
  const existingIds = existing.map(e => e.stage_id);
  const newIds = stages.filter(s => s.stage_id).map(s => s.stage_id!);
  const idsToDelete = existingIds.filter(id => !newIds.includes(id));
  
  for (const id of idsToDelete) {
    const rel = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM bill_of_materials WHERE stage_id = $1", [id]);
    if (rel[0].count === 0) {
      await db.execute("DELETE FROM project_stages WHERE stage_id = $1", [id]);
    }
  }

  for (const stage of stages) {
    if (stage.stage_id) {
      await db.execute(
        `UPDATE project_stages SET stage_name = $1 WHERE stage_id = $2`,
        [stage.stage_name, stage.stage_id]
      );
    } else {
      await db.execute(
        `INSERT INTO project_stages (project_id, stage_name) VALUES ($1, $2)`,
        [projectId, stage.stage_name]
      );
    }
  }
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

export type ItemWithPrices = Item & { prices: number[] };

export async function getItems(): Promise<ItemWithPrices[]> {
  const db = await getDB();
  const items = await db.select<Item[]>("SELECT * FROM items ORDER BY category ASC, item_name ASC");
  const prices = await db.select<{ item_id: number; price: number }[]>("SELECT item_id, price FROM item_prices");
  
  return items.map(item => ({
    ...item,
    prices: prices.filter(p => p.item_id === item.item_id).map(p => p.price)
  }));
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

export type ItemPriceWithRelation = ItemPrice & { has_relation?: boolean };

export async function getItemPrices(itemId: number): Promise<ItemPriceWithRelation[]> {
  const db = await getDB();
  const prices = await db.select<{ price_id: number; item_id: number; price: number; created_at?: string; bom_count: number; po_count: number }[]>(
    `SELECT 
       p.*,
       (SELECT COUNT(*) FROM bill_of_materials b WHERE b.item_id = p.item_id AND b.estimated_unit_price = p.price) as bom_count,
       (SELECT COUNT(*) FROM po_items po WHERE po.item_id = p.item_id AND po.unit_price = p.price) as po_count
     FROM item_prices p
     WHERE p.item_id = $1
     ORDER BY p.price_id ASC`,
    [itemId]
  );
  
  return prices.map(p => ({
    ...p,
    has_relation: p.bom_count > 0 || p.po_count > 0
  })) as ItemPriceWithRelation[];
}

export async function saveItemPrices(itemId: number, prices: { price_id?: number, price: number }[]): Promise<void> {
  const db = await getDB();
  
  const existing = await db.select<{ price_id: number }[]>("SELECT price_id FROM item_prices WHERE item_id = $1", [itemId]);
  const existingIds = existing.map(e => e.price_id);
  const newIds = prices.filter(p => p.price_id).map(p => p.price_id!);
  const idsToDelete = existingIds.filter(id => !newIds.includes(id));
  
  for (const id of idsToDelete) {
    await db.execute("DELETE FROM item_prices WHERE price_id = $1", [id]);
  }

  for (const price of prices) {
    if (price.price_id) {
      await db.execute(
        `UPDATE item_prices SET price = $1 WHERE price_id = $2`,
        [price.price, price.price_id]
      );
    } else {
      await db.execute(
        `INSERT INTO item_prices (item_id, price) VALUES ($1, $2)`,
        [itemId, price.price]
      );
    }
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
