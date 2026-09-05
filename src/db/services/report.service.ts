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
  item_id: string;
  item_code: string;
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
  item_id: string;
  item_price_id: string;
  item_code: string;
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
  item_id: string;
  item_price_id: string;
  price: number;
  qty: number;
  has_tax: number;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category: string;
  unit: string;
  vendor_name: string | null;
}

interface RawReceiptRow {
  item_id: string;
  total_delivered: number;
}

function createDefaultReportItem(row: RawRequirementRow | RawOrderRow, isUnplanned: boolean): RequirementReportItem {
  return {
    category: row.category || "LAINNYA",
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

/**
 * Generates the full Requirement fulfillment report for a project.
 * Items in Requirements and Orders are grouped strictly by item_id (one row per item).
 * If an item has multiple prices/variants in BOM or PO, all variants are preserved in planned_variants / order_variants.
 */
export async function getRequirementReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<RequirementReportItem[]> {
  try {
    // 1. Build Requirements (BOM) Query
    const requirementQuery = new QueryBuilder()
      .select(
        "requirements.item_id",
        "requirements.item_price_id",
        "items.item_code",
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
      .orderBy("items.item_id", "ASC");

    // 2. Build Orders (PO) Query
    const orderQuery = new QueryBuilder()
      .select(
        "order_items.item_id",
        "order_items.item_price_id",
        "item_prices.price",
        "order_items.qty",
        "order_items.has_tax",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name as category",
        "units.unit_name as unit",
        "vendors.vendor_name",
      )
      .from("order_items", "order_items")
      .join("orders", "orders", "orders.order_id = order_items.order_id")
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

    // 3. Build Receipts (NP) Query grouped by item_id (only counting active non-deleted receipts and orders)
    const receiptQuery = new QueryBuilder()
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
      .groupBy("order_items.item_id");

    // Execute all 3 queries in parallel via QueryBuilder getMany
    const [rawRequirements, rawOrders, rawReceipts] = await Promise.all([
      requirementQuery.getMany<RawRequirementRow>(),
      orderQuery.getMany<RawOrderRow>(),
      receiptQuery.getMany<RawReceiptRow>(),
    ]);

    const receiptMap = new Map<string, number>();
    for (const r of rawReceipts) {
      receiptMap.set(r.item_id, r.total_delivered || 0);
    }

    // 4. Group strictly by item_id
    const itemMap = new Map<string, RequirementReportItem>();

    // Process Requirements (BOM)
    for (const req of rawRequirements) {
      let item = itemMap.get(req.item_id);
      if (!item) {
        item = createDefaultReportItem(req, false);
        itemMap.set(req.item_id, item);
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
      let item = itemMap.get(ord.item_id);
      if (!item) {
        item = createDefaultReportItem(ord, true);
        itemMap.set(ord.item_id, item);
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

    // 5. Populate delivery & sort
    const plannedList: RequirementReportItem[] = [];
    const unplannedList: RequirementReportItem[] = [];

    for (const item of itemMap.values()) {
      item.total_delivered = receiptMap.get(item.item_id) || 0;
      if (!item.price && item.order_variants.length > 0) {
        item.price = item.order_variants[0].price;
      }

      if (item.is_unplanned) {
        unplannedList.push(item);
      } else {
        plannedList.push(item);
      }
    }

    plannedList.sort((a, b) => (a.item_name || "").localeCompare(b.item_name || ""));
    unplannedList.sort((a, b) => (a.item_name || "").localeCompare(b.item_name || ""));

    return [...plannedList, ...unplannedList];
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
 * Gets all BOM (requirement) items for a project formatted for export.
 */
export async function getProjectRequirementReport(projectId: string): Promise<RequirementReportDetailItem[]> {
  try {
    const query = new QueryBuilder()
      .select(
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
      .orderBy("categories.category_name", "ASC")
      .orderBy("items.item_name", "ASC");

    const raw = await query.getMany<{
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

    return raw.map((r) => {
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
  } catch (error) {
    throw wrapDbError(error, "requirement_report");
  }
}
