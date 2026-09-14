/**
 * Report Service — Requirement fulfillment, item timeline log, and project export logic.
 */

import { QueryBuilder } from "@/db/core/query-builder";
import { DbError, wrapDbError } from "@/db/core/errors";
import { calcDPP, calcTax } from "@/utils/calc";

export interface RequirementReportVariant {
  item_price_id: string;
  price: number;
  qty: number;
  has_tax: boolean;
  dpp: number;
  tax_amount: number;
  subtotal: number;
  vendor_name?: string | null;
}

export interface RequirementReportItem {
  requirement_group_id?: string | null;
  group_name?: string | null;
  item_id: string;
  item_code: string;
  category_id?: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category: string;
  unit: string;
  /** Primary / reference price */
  price?: number;
  planned_variants: RequirementReportVariant[];
  order_variants: RequirementReportVariant[];
  planned_volume: number;
  planned_dpp: number;
  planned_tax: number;
  planned_budget: number;
  total_ordered: number;
  total_order_dpp: number;
  total_order_tax: number;
  total_order_price: number;
  total_delivered: number;
  is_unplanned?: boolean;
  is_empty_group?: boolean;
  is_pagu_account?: boolean;
}

export interface ItemLogEntry {
  id: string;
  date: string;
  type: "Order" | "Receipt";
  reference: string;
  qty: number;
  vendor_name: string | null;
}

export interface OrderReportItem {
  requirement_group_id?: string | null;
  group_name?: string | null;
  order_code: string;
  order_date: string;
  vendor_name: string | null;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
  price: number;
  has_tax: boolean;
  total_price: number;
}

export interface ReceiptReportItem {
  receipt_code: string;
  receipt_date: string;
  order_code: string;
  vendor_name: string | null;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
}

export interface RequirementReportDetailItem {
  requirement_group_id?: string | null;
  group_name?: string | null;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
  price: number;
  has_tax: boolean;
  dpp: number;
  tax_amount: number;
  total_price: number;
}

interface RawRequirementRow {
  requirement_group_id?: string | null;
  group_name?: string | null;
  item_id: string;
  item_price_id: string;
  item_code: string;
  category_id?: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category: string;
  unit: string;
  price: number;
  qty: number;
  has_tax: number;
}

interface RawOrderRow {
  requirement_group_id?: string | null;
  group_name?: string | null;
  item_id: string;
  item_price_id: string;
  price: number;
  qty: number;
  has_tax: number;
  item_code: string;
  category_id?: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category: string;
  unit: string;
  vendor_name: string | null;
}

interface RawReceiptRow {
  requirement_group_id?: string | null;
  item_id: string;
  total_delivered: number;
}

function createDefaultReportItem(row: RawRequirementRow | RawOrderRow, isUnplanned: boolean): RequirementReportItem {
  return {
    requirement_group_id: row.requirement_group_id ?? null,
    group_name: row.group_name ?? null,
    category: row.category || "LAINNYA",
    category_id: row.category_id,
    category_code: row.category_code,
    category_prefix: row.category_prefix,
    is_unplanned: isUnplanned,
    item_code: row.item_code,
    item_id: row.item_id,
    item_name: row.item_name,
    order_variants: [],
    planned_budget: 0,
    planned_dpp: 0,
    planned_tax: 0,
    planned_variants: [],
    planned_volume: 0,
    price: row.price,
    total_delivered: 0,
    total_order_dpp: 0,
    total_order_price: 0,
    total_order_tax: 0,
    total_ordered: 0,
    unit: row.unit || "-",
  };
}

const makeKey = (groupId: string | null | undefined, itemId: string) => `${groupId || "none"}__${itemId}`;

/**
 * Generates the full Requirement fulfillment report for a project.
 * Items in Requirements and Orders are grouped per (requirement_group_id, item_id).
 * If an item has multiple prices/variants in BOQ or PO, all variants are preserved in planned_variants / order_variants.
 */
export async function getRequirementReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<RequirementReportItem[]> {
  try {
    // 1. Build Requirements (BOQ) Query
    const requirementQuery = new QueryBuilder()
      .select(
        "requirements.requirement_group_id",
        "groups.group_name",
        "requirements.item_id",
        "requirements.item_price_id",
        "items.item_code",
        "categories.category_id",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name as category",
        "units.unit_name as unit",
        "item_prices.price as price",
        "requirements.qty",
        "requirements.has_tax",
      )
      .from("requirements", "requirements")
      .leftJoin(
        "requirement_groups",
        "groups",
        "requirements.requirement_group_id = groups.requirement_group_id AND groups.deleted_at IS NULL",
      )
      .join("items", "items", "items.item_id = requirements.item_id AND items.deleted_at IS NULL")
      .join(
        "item_prices",
        "item_prices",
        "item_prices.item_price_id = requirements.item_price_id AND item_prices.deleted_at IS NULL",
      )
      .leftJoin(
        "item_categories",
        "categories",
        "items.category_id = categories.category_id AND categories.deleted_at IS NULL",
      )
      .leftJoin("units", "units", "items.unit_id = units.unit_id AND units.deleted_at IS NULL")
      .where("requirements.project_id", "=", projectId)
      .withSoftDelete("requirements")
      .orderBy("groups.requirement_group_id", "ASC")
      .orderBy("items.item_id", "ASC");

    // 2. Build Orders (PO) Query
    const orderQuery = new QueryBuilder()
      .select(
        "COALESCE(order_items.requirement_group_id, orders.requirement_group_id) as requirement_group_id",
        "groups.group_name",
        "order_items.item_id",
        "order_items.item_price_id",
        "item_prices.price",
        "order_items.qty",
        "order_items.has_tax",
        "items.item_code",
        "categories.category_id",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name as category",
        "units.unit_name as unit",
        "vendors.vendor_name",
      )
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .leftJoin(
        "requirement_groups",
        "groups",
        "COALESCE(order_items.requirement_group_id, orders.requirement_group_id) = groups.requirement_group_id AND groups.deleted_at IS NULL",
      )
      .join("items", "items", "items.item_id = order_items.item_id AND items.deleted_at IS NULL")
      .join(
        "item_prices",
        "item_prices",
        "item_prices.item_price_id = order_items.item_price_id AND item_prices.deleted_at IS NULL",
      )
      .leftJoin(
        "item_categories",
        "categories",
        "items.category_id = categories.category_id AND categories.deleted_at IS NULL",
      )
      .leftJoin("units", "units", "items.unit_id = units.unit_id AND units.deleted_at IS NULL")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
      .where("orders.project_id", "=", projectId)
      .withSoftDelete("orders")
      .when(Boolean(startDate), (q) => q.where("orders.order_date", ">=", startDate!))
      .when(Boolean(endDate), (q) => q.where("orders.order_date", "<=", endDate!));

    // 3. Build Receipts (NP) Query grouped by requirement_group_id and item_id
    const receiptQuery = new QueryBuilder()
      .select("COALESCE(order_items.requirement_group_id, orders.requirement_group_id) as requirement_group_id")
      .select("order_items.item_id")
      .selectSum("receipt_items.qty", "total_delivered", 0)
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .where("orders.project_id", "=", projectId)
      .withSoftDelete("receipts", "orders")
      .when(Boolean(startDate), (q) => q.where("receipts.receipt_date", ">=", startDate!))
      .when(Boolean(endDate), (q) => q.where("receipts.receipt_date", "<=", endDate!))
      .groupBy("COALESCE(order_items.requirement_group_id, orders.requirement_group_id), order_items.item_id");

    // 4. Build Groups Query to ensure empty groups appear
    const groupsQuery = new QueryBuilder()
      .select("requirement_group_id", "group_name", "budget")
      .from("requirement_groups")
      .where("project_id", "=", projectId)
      .withSoftDelete("requirement_groups")
      .orderBy("requirement_group_id", "ASC");

    // Execute all queries in parallel via QueryBuilder getMany
    const [rawRequirements, rawOrders, rawReceipts, rawGroups] = await Promise.all([
      requirementQuery.getMany<RawRequirementRow>(),
      orderQuery.getMany<RawOrderRow>(),
      receiptQuery.getMany<RawReceiptRow>(),
      groupsQuery.getMany<{ requirement_group_id: string; group_name: string; budget: number }>(),
    ]);

    const receiptMap = new Map<string, number>();
    for (const r of rawReceipts) {
      const key = makeKey(r.requirement_group_id, r.item_id);
      receiptMap.set(key, (receiptMap.get(key) || 0) + (r.total_delivered || 0));
    }

    // 4. Group by (requirement_group_id, item_id)
    const itemMap = new Map<string, RequirementReportItem>();

    // Process Requirements (BOQ)
    for (const req of rawRequirements) {
      const key = makeKey(req.requirement_group_id, req.item_id);
      let item = itemMap.get(key);
      if (!item) {
        item = createDefaultReportItem(req, false);
        itemMap.set(key, item);
      }

      const dpp = calcDPP(req.qty, req.price);
      const taxAmount = calcTax(dpp, Boolean(req.has_tax));
      const subtotal = dpp + taxAmount;

      item.planned_variants.push({
        dpp,
        has_tax: Boolean(req.has_tax),
        item_price_id: req.item_price_id,
        price: req.price,
        qty: req.qty,
        subtotal,
        tax_amount: taxAmount,
        vendor_name: null,
      });
      item.planned_volume += req.qty;
      item.planned_dpp += dpp;
      item.planned_tax += taxAmount;
      item.planned_budget += subtotal;
    }

    // Process Orders (PO)
    for (const ord of rawOrders) {
      const key = makeKey(ord.requirement_group_id, ord.item_id);
      let item = itemMap.get(key);
      if (!item) {
        item = createDefaultReportItem(ord, true);
        itemMap.set(key, item);
      }

      const dpp = calcDPP(ord.qty, ord.price);
      const taxAmount = calcTax(dpp, Boolean(ord.has_tax));
      const subtotal = dpp + taxAmount;

      item.order_variants.push({
        dpp,
        has_tax: Boolean(ord.has_tax),
        item_price_id: ord.item_price_id,
        price: ord.price,
        qty: ord.qty,
        subtotal,
        tax_amount: taxAmount,
        vendor_name: ord.vendor_name,
      });
      item.total_ordered += ord.qty;
      item.total_order_dpp += dpp;
      item.total_order_tax += taxAmount;
      item.total_order_price += subtotal;
    }

    // Process Groups without any items in itemMap
    const groupsWithItems = new Set<string>();
    for (const item of itemMap.values()) {
      if (item.requirement_group_id) {
        groupsWithItems.add(item.requirement_group_id);
      }
    }

    for (const g of rawGroups) {
      if (!groupsWithItems.has(g.requirement_group_id)) {
        const key = makeKey(g.requirement_group_id, `empty_${g.requirement_group_id}`);
        const hasBudget = Boolean(g.budget && g.budget > 0);
        itemMap.set(key, {
          requirement_group_id: g.requirement_group_id,
          group_name: g.group_name,
          category: "-",
          category_id: undefined,
          category_code: undefined,
          category_prefix: undefined,
          is_unplanned: false,
          is_empty_group: !hasBudget,
          is_pagu_account: hasBudget,
          item_code: "-",
          item_id: `empty_${g.requirement_group_id}`,
          item_name: hasBudget ? "Pagu Anggaran (Rekening)" : "(Belum ada rincian item)",
          order_variants: [],
          planned_budget: hasBudget ? g.budget : 0,
          planned_dpp: hasBudget ? g.budget : 0,
          planned_tax: 0,
          planned_variants: [],
          planned_volume: hasBudget ? 1 : 0,
          price: hasBudget ? g.budget : 0,
          total_delivered: 0,
          total_order_dpp: 0,
          total_order_price: 0,
          total_order_tax: 0,
          total_ordered: 0,
          unit: hasBudget ? "LS" : "-",
        });
      }
    }

    // 5. Populate delivery & sort by group_name, planned status, category_id, item_name
    const allItems = Array.from(itemMap.values());
    for (const item of allItems) {
      const key = makeKey(item.requirement_group_id, item.item_id);
      item.total_delivered = receiptMap.get(key) || 0;
      if (!item.price && item.order_variants.length > 0) {
        item.price = item.order_variants[0].price;
      }
    }

    allItems.sort((a, b) => {
      const groupA = a.requirement_group_id || "";
      const groupB = b.requirement_group_id || "";
      const groupCmp = groupA.localeCompare(groupB);
      if (groupCmp !== 0) return groupCmp;

      if (Boolean(a.is_unplanned) !== Boolean(b.is_unplanned)) {
        return a.is_unplanned ? 1 : -1;
      }

      const catA = a.category_id || "\uffff";
      const catB = b.category_id || "\uffff";
      const catCmp = catA.localeCompare(catB);
      if (catCmp !== 0) return catCmp;

      return (a.item_name || "").localeCompare(b.item_name || "");
    });

    return allItems;
  } catch (error) {
    if (error instanceof DbError) {
      throw error;
    }
    throw wrapDbError(error, "dashboard");
  }
}

/**
 * Gets chronological log of Orders and Receipts for a specific item in a project.
 */
export async function getItemLog(projectId: string, itemId: string, itemPriceId?: string): Promise<ItemLogEntry[]> {
  try {
    // 1. Get Orders
    const orderQuery = new QueryBuilder()
      .select("orders.order_id as id", "orders.order_date as date")
      .selectRaw("'Order' as type")
      .selectRaw("orders.order_code as reference")
      .select("order_items.qty", "vendors.vendor_name")
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
      .where("orders.project_id", "=", projectId)
      .where("order_items.item_id", "=", itemId)
      .withSoftDelete("orders")
      .when(Boolean(itemPriceId && itemPriceId.trim() !== ""), (q) =>
        q.where("order_items.item_price_id", "=", itemPriceId!),
      );

    // 2. Get Receipts (active receipts only)
    const receiptQuery = new QueryBuilder()
      .select("receipts.receipt_id as id", "receipts.receipt_date as date")
      .selectRaw("'Receipt' as type")
      .selectRaw("receipts.receipt_code as reference")
      .selectRaw("receipt_items.qty")
      .selectRaw("vendors.vendor_name")
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
      .where("orders.project_id", "=", projectId)
      .where("order_items.item_id", "=", itemId)
      .withSoftDelete("receipts", "orders")
      .when(Boolean(itemPriceId && itemPriceId.trim() !== ""), (q) =>
        q.where("order_items.item_price_id", "=", itemPriceId!),
      );

    // Execute queries in parallel
    const [orderLogs, receiptLogs] = await Promise.all([
      orderQuery.getMany<ItemLogEntry>(),
      receiptQuery.getMany<ItemLogEntry>(),
    ]);

    // 3. Combine and sort by date
    const combinedLogs = [...orderLogs, ...receiptLogs];
    combinedLogs.sort((logA, logB) => new Date(logA.date).getTime() - new Date(logB.date).getTime());

    return combinedLogs;
  } catch (error) {
    if (error instanceof DbError) {
      throw error;
    }
    throw wrapDbError(error, "dashboard_log");
  }
}

/**
 * Gets the order report for all items in a project within an optional date range.
 */
export async function getProjectOrderReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<OrderReportItem[]> {
  try {
    const query = new QueryBuilder()
      .select(
        "orders.requirement_group_id",
        "COALESCE(item_groups.group_name, order_groups.group_name) as group_name",
        "orders.order_code",
        "orders.order_date",
        "vendors.vendor_name",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name",
        "units.unit_name",
        "order_items.qty",
        "item_prices.price",
        "order_items.has_tax",
      )
      .selectRaw(
        "order_items.qty * item_prices.price * (CASE WHEN order_items.has_tax = 1 THEN 1.12 ELSE 1.0 END) as total_price",
      )
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .leftJoin(
        "requirement_groups",
        "order_groups",
        "order_groups.requirement_group_id = orders.requirement_group_id AND order_groups.deleted_at IS NULL",
      )
      .leftJoin(
        "requirement_groups",
        "item_groups",
        "item_groups.requirement_group_id = order_items.requirement_group_id AND item_groups.deleted_at IS NULL",
      )
      .join("items", "items", "items.item_id = order_items.item_id AND items.deleted_at IS NULL")
      .join(
        "item_prices",
        "item_prices",
        "item_prices.item_price_id = order_items.item_price_id AND item_prices.deleted_at IS NULL",
      )
      .leftJoin(
        "item_categories",
        "categories",
        "categories.category_id = items.category_id AND categories.deleted_at IS NULL",
      )
      .leftJoin("units", "units", "units.unit_id = items.unit_id AND units.deleted_at IS NULL")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
      .where("orders.project_id", "=", projectId)
      .withSoftDelete("orders")
      .when(Boolean(startDate), (q) => q.where("orders.order_date", ">=", startDate!))
      .when(Boolean(endDate), (q) => q.where("orders.order_date", "<=", endDate!))
      .orderBy("orders.order_id", "ASC");

    const rows = await query.getMany<OrderReportItem>();
    return rows.map((r) => ({
      ...r,
      has_tax: Boolean(r.has_tax),
    }));
  } catch (error) {
    throw wrapDbError(error, "order_report");
  }
}

/**
 * Gets the receipt report for all items in a project within an optional date range.
 */
export async function getProjectReceiptReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<ReceiptReportItem[]> {
  try {
    const query = new QueryBuilder()
      .select(
        "receipts.receipt_code",
        "receipts.receipt_date",
        "orders.order_code",
        "vendors.vendor_name",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name",
        "units.unit_name",
        "receipt_items.qty",
      )
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
      .join("items", "items", "items.item_id = order_items.item_id AND items.deleted_at IS NULL")
      .leftJoin(
        "item_categories",
        "categories",
        "categories.category_id = items.category_id AND categories.deleted_at IS NULL",
      )
      .leftJoin("units", "units", "units.unit_id = items.unit_id AND units.deleted_at IS NULL")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL")
      .where("orders.project_id", "=", projectId)
      .withSoftDelete("receipts", "orders")
      .when(Boolean(startDate), (q) => q.where("receipts.receipt_date", ">=", startDate!))
      .when(Boolean(endDate), (q) => q.where("receipts.receipt_date", "<=", endDate!))
      .orderBy("receipts.receipt_id", "ASC");

    return await query.getMany<ReceiptReportItem>();
  } catch (error) {
    throw wrapDbError(error, "receipt_report");
  }
}

/**
 * Gets all BOQ (requirement) items for a project formatted for export.
 */
export async function getProjectRequirementReport(projectId: string): Promise<RequirementReportDetailItem[]> {
  try {
    const query = new QueryBuilder()
      .select(
        "requirements.requirement_group_id",
        "requirement_groups.group_name",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name",
        "units.unit_name",
        "requirements.qty",
        "item_prices.price",
        "requirements.has_tax",
      )
      .from("requirements", "requirements")
      .leftJoin(
        "requirement_groups",
        "requirement_groups",
        "requirement_groups.requirement_group_id = requirements.requirement_group_id AND requirement_groups.deleted_at IS NULL",
      )
      .join("items", "items", "items.item_id = requirements.item_id AND items.deleted_at IS NULL")
      .join(
        "item_prices",
        "item_prices",
        "item_prices.item_price_id = requirements.item_price_id AND item_prices.deleted_at IS NULL",
      )
      .leftJoin(
        "item_categories",
        "categories",
        "categories.category_id = items.category_id AND categories.deleted_at IS NULL",
      )
      .leftJoin("units", "units", "units.unit_id = items.unit_id AND units.deleted_at IS NULL")
      .where("requirements.project_id", "=", projectId)
      .withSoftDelete("requirements")
      .orderBy("COALESCE(requirement_groups.requirement_group_id, '')", "ASC")
      .orderBy("items.item_name", "ASC");

    const raw = await query.getMany<{
      requirement_group_id?: string | null;
      group_name?: string | null;
      item_code: string;
      category_prefix?: string;
      category_code?: string;
      item_name: string;
      category_name: string | null;
      unit_name: string | null;
      qty: number;
      price: number;
      has_tax: number;
    }>();

    const groupsQuery = new QueryBuilder()
      .select("requirement_group_id", "group_name", "budget")
      .from("requirement_groups")
      .where("project_id", "=", projectId)
      .withSoftDelete("requirement_groups")
      .orderBy("requirement_group_id", "ASC");

    const rawGroups = await groupsQuery.getMany<{ requirement_group_id: string; group_name: string; budget: number }>();

    const mapped = raw.map((r) => {
      const dpp = calcDPP(r.qty, r.price);
      const taxAmount = calcTax(dpp, Boolean(r.has_tax));
      return {
        ...r,
        has_tax: Boolean(r.has_tax),
        dpp,
        tax_amount: taxAmount,
        total_price: dpp + taxAmount,
      };
    });

    const groupsWithItems = new Set<string>();
    for (const r of mapped) {
      if (r.requirement_group_id) {
        groupsWithItems.add(r.requirement_group_id);
      }
    }

    for (const g of rawGroups) {
      if (!groupsWithItems.has(g.requirement_group_id)) {
        const hasBudget = Boolean(g.budget && g.budget > 0);
        mapped.push({
          requirement_group_id: g.requirement_group_id,
          group_name: g.group_name,
          item_code: "-",
          category_prefix: undefined,
          category_code: undefined,
          item_name: hasBudget ? "Pagu Anggaran (Rekening)" : "(Belum ada rincian item)",
          category_name: "-",
          unit_name: hasBudget ? "LS" : "-",
          qty: hasBudget ? 1 : 0,
          price: hasBudget ? g.budget : 0,
          has_tax: false,
          dpp: hasBudget ? g.budget : 0,
          tax_amount: 0,
          total_price: hasBudget ? g.budget : 0,
        });
      }
    }

    mapped.sort((a, b) => {
      const groupA = a.requirement_group_id || "";
      const groupB = b.requirement_group_id || "";
      const groupCmp = groupA.localeCompare(groupB);
      if (groupCmp !== 0) return groupCmp;
      return (a.item_name || "").localeCompare(b.item_name || "");
    });

    return mapped;
  } catch (error) {
    throw wrapDbError(error, "requirement_report");
  }
}
