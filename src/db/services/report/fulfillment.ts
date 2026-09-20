import { QueryBuilder } from "@/db/core/query-builder";
import { DbError, wrapDbError } from "@/db/core/errors";
import { calcDPP, calcTax } from "@/utils/calc";
import type { RequirementReportItem, RequirementReportVariant } from "./types";

interface RawRequirementRow {
  requirement_group_id: string | null;
  group_name: string | null;
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
  requirement_group_id: string | null;
  group_name: string | null;
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
  requirement_group_id: string | null;
  item_id: string;
  item_price_id: string;
  price: number;
  qty: number;
  has_tax: number;
  vendor_name: string | null;
}

interface RawGroupRow {
  requirement_group_id: string;
  group_name: string;
  has_detail: number;
  budget: number | null;
}

const makeKey = (groupId: string | null | undefined, itemId: string) => `${groupId || "none"}__${itemId}`;

function createEmptyItem(
  row: {
    requirement_group_id?: string | null;
    group_name?: string | null;
    category?: string;
    category_id?: string;
    category_code?: string;
    category_prefix?: string;
    item_code: string;
    item_id: string;
    item_name: string;
    price?: number;
    unit?: string;
  },
  isUnplanned: boolean,
  groupBudget: number | null,
): RequirementReportItem {
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
    receipt_variants: [],
    planned_budget: 0,
    planned_dpp: 0,
    planned_tax: 0,
    planned_variants: [],
    planned_volume: 0,
    price: row.price,
    total_delivered: 0,
    total_receipt_dpp: 0,
    total_receipt_tax: 0,
    total_receipt_price: 0,
    total_order_dpp: 0,
    total_order_price: 0,
    total_order_tax: 0,
    total_ordered: 0,
    unit: row.unit || "-",
    group_budget: groupBudget,
  };
}

function calculateVariant(
  qty: number,
  price: number,
  hasTax: boolean,
): { dpp: number; taxAmount: number; subtotal: number } {
  const dpp = calcDPP(qty, price);
  const taxAmount = calcTax(dpp, hasTax);
  return { dpp, taxAmount, subtotal: dpp + taxAmount };
}

/**
 * Generates the full Requirement fulfillment report for a project.
 * Items in Requirements and Orders are preserved per item (requirement_group_id, item_id).
 */
export async function getRequirementReport(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<RequirementReportItem[]> {
  try {
    // 1. BOQ Query — price comes from requirements.price (snapshot)
    const boqQuery = new QueryBuilder()
      .select(
        "req.requirement_group_id",
        "grp.group_name",
        "req.item_id",
        "req.item_price_id",
        "items.item_code",
        "cats.category_id",
        "cats.prefix as category_prefix",
        "cats.category_code",
        "items.item_name",
        "cats.category_name as category",
        "units.unit_name as unit",
        "ip.price as price",
        "req.qty",
        "req.has_tax",
      )
      .from("requirements", "req")
      .leftJoin("requirement_groups", "grp", "req.requirement_group_id = grp.requirement_group_id")
      .join("items", "items", "items.item_id = req.item_id")
      .join("item_prices", "ip", "ip.item_price_id = req.item_price_id")
      .leftJoin("item_categories", "cats", "items.category_id = cats.category_id")
      .leftJoin("units", "units", "items.unit_id = units.unit_id")
      .where("req.project_id", "=", projectId)
      .orderBy("grp.requirement_group_id", "ASC")
      .orderBy("items.item_id", "ASC");

    // 2. Orders Query — price comes from item_prices via oi.item_price_id
    const orderQuery = new QueryBuilder()
      .select(
        "oi.requirement_group_id as requirement_group_id",
        "grp.group_name",
        "oi.item_id",
        "oi.item_price_id",
        "ip.price as price",
        "oi.qty",
        "oi.has_tax",
        "items.item_code",
        "cats.category_id",
        "cats.prefix as category_prefix",
        "cats.category_code",
        "items.item_name",
        "cats.category_name as category",
        "units.unit_name as unit",
        "vendors.vendor_name",
      )
      .from("order_items", "oi")
      .join("orders", "ord", "ord.order_id = oi.order_id")
      .join("item_prices", "ip", "ip.item_price_id = oi.item_price_id")
      .leftJoin("requirement_groups", "grp", "oi.requirement_group_id = grp.requirement_group_id")
      .join("items", "items", "items.item_id = oi.item_id")
      .leftJoin("item_categories", "cats", "items.category_id = cats.category_id")
      .leftJoin("units", "units", "items.unit_id = units.unit_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = oi.vendor_id")
      .where("ord.project_id", "=", projectId)
      .when(Boolean(startDate), (builder: QueryBuilder) => builder.where("ord.order_date", ">=", startDate!))
      .when(Boolean(endDate), (builder: QueryBuilder) => builder.where("ord.order_date", "<=", endDate!));

    // 3. Receipts Query — price comes from item_prices via ri.item_price_id
    const receiptQuery = new QueryBuilder()
      .select(
        "oi.requirement_group_id as requirement_group_id",
        "oi.item_id",
        "ri.item_price_id",
        "ip.price as price",
        "ri.qty",
        "ri.has_tax",
        "vendors.vendor_name",
      )
      .from("receipt_items", "ri")
      .join("receipts", "rec", "rec.receipt_id = ri.receipt_id")
      .join("order_items", "oi", "oi.order_item_id = ri.order_item_id")
      .join("orders", "ord", "ord.order_id = oi.order_id")
      .join("item_prices", "ip", "ip.item_price_id = ri.item_price_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = oi.vendor_id")
      .where("ord.project_id", "=", projectId)
      .when(Boolean(startDate), (builder: QueryBuilder) => builder.where("rec.receipt_date", ">=", startDate!))
      .when(Boolean(endDate), (builder: QueryBuilder) => builder.where("rec.receipt_date", "<=", endDate!));

    // 4. Groups Query
    const groupsQuery = new QueryBuilder()
      .select("requirement_group_id", "group_name", "has_detail", "budget")
      .from("requirement_groups")
      .where("project_id", "=", projectId)
      .orderBy("requirement_group_id", "ASC");

    // Execute queries concurrently
    const [boqRows, orderRows, receiptRows, groupRows] = await Promise.all([
      boqQuery.getMany<RawRequirementRow>(),
      orderQuery.getMany<RawOrderRow>(),
      receiptQuery.getMany<RawReceiptRow>(),
      groupsQuery.getMany<RawGroupRow>(),
    ]);

    const groupBudgetMap = new Map<string, number>();
    for (const group of groupRows) {
      if (group.has_detail && group.budget != null && group.budget > 0) {
        groupBudgetMap.set(group.requirement_group_id, group.budget);
      }
    }

    const itemMap = new Map<string, RequirementReportItem>();

    // Process BOQ
    for (const req of boqRows) {
      const key = makeKey(req.requirement_group_id, req.item_id);
      let item = itemMap.get(key);
      if (!item) {
        const groupBudget = req.requirement_group_id ? (groupBudgetMap.get(req.requirement_group_id) ?? null) : null;
        item = createEmptyItem(req, false, groupBudget);
        itemMap.set(key, item);
      }

      const hasTax = Boolean(req.has_tax);
      const { dpp, taxAmount, subtotal } = calculateVariant(req.qty, req.price, hasTax);

      const variant: RequirementReportVariant = {
        item_price_id: req.item_price_id,
        price: req.price,
        qty: req.qty,
        has_tax: hasTax,
        dpp,
        tax_amount: taxAmount,
        subtotal,
        vendor_name: null,
      };

      item.planned_variants.push(variant);
      item.planned_volume += req.qty;
      item.planned_dpp += dpp;
      item.planned_tax += taxAmount;
      item.planned_budget += subtotal;
    }

    // Process Orders
    for (const ord of orderRows) {
      const key = makeKey(ord.requirement_group_id, ord.item_id);
      let item = itemMap.get(key);
      if (!item) {
        const groupBudget = ord.requirement_group_id ? (groupBudgetMap.get(ord.requirement_group_id) ?? null) : null;
        item = createEmptyItem(ord, true, groupBudget);
        itemMap.set(key, item);
      }

      const hasTax = Boolean(ord.has_tax);
      const { dpp, taxAmount, subtotal } = calculateVariant(ord.qty, ord.price, hasTax);

      const variant: RequirementReportVariant = {
        item_price_id: ord.item_price_id,
        price: ord.price,
        qty: ord.qty,
        has_tax: hasTax,
        dpp,
        tax_amount: taxAmount,
        subtotal,
        vendor_name: ord.vendor_name,
      };

      item.order_variants.push(variant);
      item.total_ordered += ord.qty;
      item.total_order_dpp += dpp;
      item.total_order_tax += taxAmount;
      item.total_order_price += subtotal;
    }

    // Process Receipts
    for (const rec of receiptRows) {
      const key = makeKey(rec.requirement_group_id, rec.item_id);
      let item = itemMap.get(key);
      if (!item) {
        // Jika ada penerimaan tanpa PO atau BOQ terdaftar sebelumnya
        const groupBudget = rec.requirement_group_id ? (groupBudgetMap.get(rec.requirement_group_id) ?? null) : null;
        item = createEmptyItem(
          {
            category: "LAINNYA",
            item_code: "-",
            item_id: rec.item_id,
            item_name: "Item Penerimaan",
            requirement_group_id: rec.requirement_group_id,
          },
          true,
          groupBudget,
        );
        itemMap.set(key, item);
      }

      const hasTax = Boolean(rec.has_tax);
      const { dpp, taxAmount, subtotal } = calculateVariant(rec.qty, rec.price, hasTax);

      const variant: RequirementReportVariant = {
        dpp,
        has_tax: hasTax,
        item_price_id: rec.item_price_id,
        price: rec.price,
        qty: rec.qty,
        subtotal,
        tax_amount: taxAmount,
        vendor_name: rec.vendor_name,
      };

      if (!item.receipt_variants) {
        item.receipt_variants = [];
      }
      item.receipt_variants.push(variant);
      item.total_delivered += rec.qty;
      item.total_receipt_dpp += dpp;
      item.total_receipt_tax += taxAmount;
      item.total_receipt_price += subtotal;
    }

    // Include groups that have no items
    const existingGroupIds = new Set<string>();
    for (const reportItem of itemMap.values()) {
      if (reportItem.requirement_group_id) existingGroupIds.add(reportItem.requirement_group_id);
    }

    for (const group of groupRows) {
      if (!existingGroupIds.has(group.requirement_group_id)) {
        const key = makeKey(group.requirement_group_id, `empty_${group.requirement_group_id}`);
        itemMap.set(key, {
          requirement_group_id: group.requirement_group_id,
          group_name: group.group_name,
          category: "-",
          category_id: undefined,
          category_code: undefined,
          category_prefix: undefined,
          is_unplanned: false,
          is_empty_group: true,
          group_budget: group.has_detail ? (group.budget ?? null) : null,
          item_code: "-",
          item_id: `empty_${group.requirement_group_id}`,
          item_name: "(Belum ada rincian item)",
          order_variants: [],
          receipt_variants: [],
          planned_budget: 0,
          planned_dpp: 0,
          planned_tax: 0,
          planned_variants: [],
          planned_volume: 0,
          price: 0,
          total_delivered: 0,
          total_receipt_dpp: 0,
          total_receipt_tax: 0,
          total_receipt_price: 0,
          total_order_dpp: 0,
          total_order_price: 0,
          total_order_tax: 0,
          total_ordered: 0,
          unit: "-",
        });
      }
    }

    // Finalize all items
    const allItems = Array.from(itemMap.values());
    for (const item of allItems) {
      if (item.requirement_group_id) {
        item.group_budget = groupBudgetMap.get(item.requirement_group_id) ?? null;
      }
      if (!item.price && item.order_variants.length > 0) {
        item.price = item.order_variants[0].price;
      }
      if (!item.price && item.receipt_variants && item.receipt_variants.length > 0) {
        item.price = item.receipt_variants[0].price;
      }
    }

    // Sort by group, unplanned status, category, item_name
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
    if (error instanceof DbError) throw error;
    throw wrapDbError(error, "report_fulfillment");
  }
}
