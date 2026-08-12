import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projectStatusValues = ["ON_PROGRESS", "COMPLETED", "SUSPENDED"] as const;
export const vendorTypeValues = ["MATERIAL_SUPPLIER", "EQUIPMENT_RENTAL", "STORE"] as const;
export const itemCategoryValues = ["MATERIAL", "ALAT", "BETON", "SOLAR", "ATK/K3"] as const;
export const invoiceStatusValues = ["UNPAID", "PARTIAL", "PAID"] as const;
export const ownershipTypeValues = ["INTERNAL", "EKSTERNAL"] as const;

export const projects = sqliteTable("projects", {
  projectId: integer("project_id").primaryKey({ autoIncrement: true }),
  projectCode: text("project_code").notNull().unique(),
  projectName: text("project_name").notNull(),
  contractorName: text("contractor_name").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  status: text("status", { enum: projectStatusValues }).default("ON_PROGRESS"),
  createdAt: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const vendors = sqliteTable("vendors", {
  vendorId: integer("vendor_id").primaryKey({ autoIncrement: true }),
  vendorName: text("vendor_name").notNull().unique(),
  vendorType: text("vendor_type", { enum: vendorTypeValues }).notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const items = sqliteTable("items", {
  itemId: integer("item_id").primaryKey({ autoIncrement: true }),
  itemCode: text("item_code").unique(),
  itemName: text("item_name").notNull(),
  category: text("category", { enum: itemCategoryValues }).notNull(),
  unit: text("unit").notNull(),
});

export const purchaseOrders = sqliteTable("purchase_orders", {
  poId: integer("po_id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.projectId, { onDelete: "cascade" }),
  vendorId: integer("vendor_id").references(() => vendors.vendorId, { onDelete: "restrict" }),
  poNumber: text("po_number").notNull().unique(),
  poDate: text("po_date").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const poItems = sqliteTable("po_items", {
  poItemId: integer("po_item_id").primaryKey({ autoIncrement: true }),
  poId: integer("po_id").references(() => purchaseOrders.poId, { onDelete: "cascade" }),
  itemId: integer("item_id").references(() => items.itemId, { onDelete: "restrict" }),
  orderedVolume: real("ordered_volume").notNull(),
  unitPrice: real("unit_price").notNull(),
  subtotalPrice: real("subtotal_price").generatedAlwaysAs(sql`ordered_volume * unit_price`, { mode: "stored" }),
  ppnPercentage: real("ppn_percentage").default(0),
  ppnAmount: real("ppn_amount").generatedAlwaysAs(sql`ordered_volume * unit_price * (ppn_percentage / 100.0)`, { mode: "stored" }),
  totalPrice: real("total_price").generatedAlwaysAs(sql`ordered_volume * unit_price * (1.0 + ppn_percentage / 100.0)`, { mode: "stored" }),
});

export const deliveries = sqliteTable("deliveries", {
  deliveryId: integer("delivery_id").primaryKey({ autoIncrement: true }),
  poItemId: integer("po_item_id").references(() => poItems.poItemId, { onDelete: "cascade" }),
  deliveryDate: text("delivery_date").notNull(),
  deliveredVolume: real("delivered_volume").notNull(),
  deliveryNoteNumber: text("delivery_note_number"),
  locationDestination: text("location_destination"),
  notes: text("notes"),
});

export const equipmentLogs = sqliteTable("equipment_logs", {
  equipLogId: integer("equip_log_id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.projectId, { onDelete: "set null" }),
  vendorId: integer("vendor_id").references(() => vendors.vendorId, { onDelete: "set null" }),
  equipmentName: text("equipment_name").notNull(),
  operatorName: text("operator_name"),
  workDateStart: text("work_date_start").notNull(),
  workDateEnd: text("work_date_end"),
  durationValue: real("duration_value").notNull(),
  durationUnit: text("duration_unit").notNull(),
  ratePerUnit: real("rate_per_unit").notNull(),
  totalCost: real("total_cost").generatedAlwaysAs(sql`duration_value * rate_per_unit`, { mode: "stored" }),
  activityDescription: text("activity_description"),
});

export const invoices = sqliteTable("invoices", {
  invoiceId: integer("invoice_id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.projectId, { onDelete: "set null" }),
  vendorId: integer("vendor_id").references(() => vendors.vendorId, { onDelete: "restrict" }),
  invoiceNumber: text("invoice_number").unique(),
  invoiceDate: text("invoice_date").notNull(),
  totalAmount: real("total_amount").notNull(),
  paidAmount: real("paid_amount").default(0),
  remainingBalance: real("remaining_balance").generatedAlwaysAs(sql`total_amount - paid_amount`, { mode: "stored" }),
  paymentStatus: text("payment_status", { enum: invoiceStatusValues }).default("UNPAID"),
  ownershipType: text("ownership_type", { enum: ownershipTypeValues }).default("INTERNAL"),
  createdAt: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const invoiceItems = sqliteTable("invoice_items", {
  invItemId: integer("inv_item_id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id").references(() => invoices.invoiceId, { onDelete: "cascade" }),
  poItemId: integer("po_item_id").references(() => poItems.poItemId, { onDelete: "set null" }),
  equipLogId: integer("equip_log_id").references(() => equipmentLogs.equipLogId, { onDelete: "set null" }),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
});

export const schema = {
  projects,
  vendors,
  items,
  purchaseOrders,
  poItems,
  deliveries,
  equipmentLogs,
  invoices,
  invoiceItems,
};