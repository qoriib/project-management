import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projectStatusValues = ["ON_PROGRESS", "COMPLETED", "SUSPENDED"] as const;
export const vendorTypeValues = ["MATERIAL_SUPPLIER", "EQUIPMENT_RENTAL", "STORE"] as const;
export const itemCategoryValues = ["MATERIAL", "ALAT", "BETON", "SOLAR", "ATK/K3"] as const;
export const invoiceStatusValues = ["UNPAID", "PARTIAL", "PAID"] as const;
export const ownershipTypeValues = ["INTERNAL", "EKSTERNAL"] as const;

export const projects = sqliteTable("projects", {
  project_id: integer("project_id").primaryKey({ autoIncrement: true }),
  project_code: text("project_code").notNull().unique(),
  project_name: text("project_name").notNull(),
  contractor_name: text("contractor_name").notNull(),
  fiscal_year: integer("fiscal_year").notNull(),
  status: text("status", { enum: projectStatusValues }).default("ON_PROGRESS"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const vendors = sqliteTable("vendors", {
  vendor_id: integer("vendor_id").primaryKey({ autoIncrement: true }),
  vendor_name: text("vendor_name").notNull().unique(),
  vendor_type: text("vendor_type", { enum: vendorTypeValues }).notNull(),
  phone: text("phone"),
  address: text("address"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const items = sqliteTable("items", {
  item_id: integer("item_id").primaryKey({ autoIncrement: true }),
  item_code: text("item_code").unique(),
  item_name: text("item_name").notNull(),
  category: text("category", { enum: itemCategoryValues }).notNull(),
  unit: text("unit").notNull(),
});

export const itemCategories = sqliteTable("item_categories", {
  category_id: integer("category_id").primaryKey({ autoIncrement: true }),
  category_code: text("category_code").notNull().unique(),
  category_name: text("category_name").notNull(),
});

export const units = sqliteTable("units", {
  unit_id: integer("unit_id").primaryKey({ autoIncrement: true }),
  unit_name: text("unit_name").notNull().unique(),
});

export const purchaseOrders = sqliteTable("purchase_orders", {
  po_id: integer("po_id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id").references(() => projects.project_id, { onDelete: "cascade" }),
  vendor_id: integer("vendor_id").references(() => vendors.vendor_id, { onDelete: "restrict" }),
  po_number: text("po_number").notNull().unique(),
  po_date: text("po_date").notNull(),
  notes: text("notes"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const poItems = sqliteTable("po_items", {
  po_item_id: integer("po_item_id").primaryKey({ autoIncrement: true }),
  po_id: integer("po_id").references(() => purchaseOrders.po_id, { onDelete: "cascade" }),
  item_id: integer("item_id").references(() => items.item_id, { onDelete: "restrict" }),
  ordered_volume: real("ordered_volume").notNull(),
  unit_price: real("unit_price").notNull(),
  subtotal_price: real("subtotal_price").generatedAlwaysAs(sql`ordered_volume * unit_price`, { mode: "stored" }),
  ppn_percentage: real("ppn_percentage").default(0),
  ppn_amount: real("ppn_amount").generatedAlwaysAs(sql`ordered_volume * unit_price * (ppn_percentage / 100.0)`, { mode: "stored" }),
  total_price: real("total_price").generatedAlwaysAs(sql`ordered_volume * unit_price * (1.0 + ppn_percentage / 100.0)`, { mode: "stored" }),
});

export const deliveries = sqliteTable("deliveries", {
  delivery_id: integer("delivery_id").primaryKey({ autoIncrement: true }),
  po_item_id: integer("po_item_id").references(() => poItems.po_item_id, { onDelete: "cascade" }),
  delivery_date: text("delivery_date").notNull(),
  delivered_volume: real("delivered_volume").notNull(),
  delivery_note_number: text("delivery_note_number"),
  location_destination: text("location_destination"),
  notes: text("notes"),
});

export const equipmentLogs = sqliteTable("equipment_logs", {
  equip_log_id: integer("equip_log_id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id").references(() => projects.project_id, { onDelete: "set null" }),
  vendor_id: integer("vendor_id").references(() => vendors.vendor_id, { onDelete: "set null" }),
  equipment_name: text("equipment_name").notNull(),
  operator_name: text("operator_name"),
  work_date_start: text("work_date_start").notNull(),
  work_date_end: text("work_date_end"),
  duration_value: real("duration_value").notNull(),
  duration_unit: text("duration_unit").notNull(),
  rate_per_unit: real("rate_per_unit").notNull(),
  total_cost: real("total_cost").generatedAlwaysAs(sql`duration_value * rate_per_unit`, { mode: "stored" }),
  activity_description: text("activity_description"),
});

export const invoices = sqliteTable("invoices", {
  invoice_id: integer("invoice_id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id").references(() => projects.project_id, { onDelete: "set null" }),
  vendor_id: integer("vendor_id").references(() => vendors.vendor_id, { onDelete: "restrict" }),
  invoice_number: text("invoice_number").unique(),
  invoice_date: text("invoice_date").notNull(),
  total_amount: real("total_amount").notNull(),
  paid_amount: real("paid_amount").default(0),
  remaining_balance: real("remaining_balance").generatedAlwaysAs(sql`total_amount - paid_amount`, { mode: "stored" }),
  payment_status: text("payment_status", { enum: invoiceStatusValues }).default("UNPAID"),
  ownership_type: text("ownership_type", { enum: ownershipTypeValues }).default("INTERNAL"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const invoiceItems = sqliteTable("invoice_items", {
  inv_item_id: integer("inv_item_id").primaryKey({ autoIncrement: true }),
  invoice_id: integer("invoice_id").references(() => invoices.invoice_id, { onDelete: "cascade" }),
  po_item_id: integer("po_item_id").references(() => poItems.po_item_id, { onDelete: "set null" }),
  equip_log_id: integer("equip_log_id").references(() => equipmentLogs.equip_log_id, { onDelete: "set null" }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
});

export const schema = {
  projects,
  vendors,
  items,
  itemCategories,
  units,
  purchaseOrders,
  poItems,
  deliveries,
  equipmentLogs,
  invoices,
  invoiceItems,
};
