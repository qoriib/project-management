import { getDB } from "@/db/index";
import * as schema from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export type Project = typeof schema.projects.$inferSelect;
export type Vendor = typeof schema.vendors.$inferSelect;
export type Item = typeof schema.items.$inferSelect;
export type ItemCategory = typeof schema.itemCategories.$inferSelect;
export type Unit = typeof schema.units.$inferSelect;

// ── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.select().from(schema.projects).orderBy(desc(schema.projects.created_at));
}

export async function createProject(
  data: Omit<Project, "project_id" | "created_at">
): Promise<void> {
  const db = await getDB();
  await db.insert(schema.projects).values(data);
}

export async function updateProject(
  id: number,
  data: Partial<Omit<Project, "project_id" | "created_at">>
): Promise<void> {
  const db = await getDB();
  await db.update(schema.projects).set(data).where(eq(schema.projects.project_id, id));
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(schema.projects).where(eq(schema.projects.project_id, id));
}

// ── Vendors ──────────────────────────────────────────────────────────────────

export async function getVendors(): Promise<Vendor[]> {
  const db = await getDB();
  return db.select().from(schema.vendors).orderBy(asc(schema.vendors.vendor_name));
}

export async function createVendor(
  data: Omit<Vendor, "vendor_id" | "created_at">
): Promise<void> {
  const db = await getDB();
  await db.insert(schema.vendors).values(data);
}

export async function updateVendor(id: number, data: Partial<Omit<Vendor, "vendor_id" | "created_at">>): Promise<void> {
  const db = await getDB();
  await db.update(schema.vendors).set(data).where(eq(schema.vendors.vendor_id, id));
}

export async function deleteVendor(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(schema.vendors).where(eq(schema.vendors.vendor_id, id));
}

// ── Items (Catalog) ──────────────────────────────────────────────────────────

export async function getItems(): Promise<Item[]> {
  const db = await getDB();
  return db.select().from(schema.items).orderBy(asc(schema.items.category), asc(schema.items.item_name));
}

export async function createItem(data: Omit<Item, "item_id">): Promise<void> {
  const db = await getDB();
  await db.insert(schema.items).values(data);
}

export async function updateItem(id: number, data: Partial<Omit<Item, "item_id">>): Promise<void> {
  const db = await getDB();
  await db.update(schema.items).set(data).where(eq(schema.items.item_id, id));
}

export async function deleteItem(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(schema.items).where(eq(schema.items.item_id, id));
}

// ── Item Categories ──────────────────────────────────────────────────────────

export async function getItemCategories(): Promise<ItemCategory[]> {
  const db = await getDB();
  return db.select().from(schema.itemCategories).orderBy(asc(schema.itemCategories.category_name));
}

export async function createItemCategory(data: Omit<ItemCategory, "category_id">): Promise<void> {
  const db = await getDB();
  await db.insert(schema.itemCategories).values(data);
}

export async function updateItemCategory(id: number, data: Partial<Omit<ItemCategory, "category_id">>): Promise<void> {
  const db = await getDB();
  await db.update(schema.itemCategories).set(data).where(eq(schema.itemCategories.category_id, id));
}

export async function deleteItemCategory(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(schema.itemCategories).where(eq(schema.itemCategories.category_id, id));
}

// ── Units ────────────────────────────────────────────────────────────────────

export async function getUnits(): Promise<Unit[]> {
  const db = await getDB();
  return db.select().from(schema.units).orderBy(asc(schema.units.unit_name));
}

export async function createUnit(data: Omit<Unit, "unit_id">): Promise<void> {
  const db = await getDB();
  await db.insert(schema.units).values(data);
}

export async function updateUnit(id: number, data: Partial<Omit<Unit, "unit_id">>): Promise<void> {
  const db = await getDB();
  await db.update(schema.units).set(data).where(eq(schema.units.unit_id, id));
}

export async function deleteUnit(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(schema.units).where(eq(schema.units.unit_id, id));
}
