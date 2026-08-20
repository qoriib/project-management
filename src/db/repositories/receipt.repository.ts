/**
 * Receipt Repository — Receipt management.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import { type CreateReceipt, type Receipt, ReceiptModel } from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type ReceiptSummary = Receipt & {
  item_count?: number;
  vendor_names?: string[];
  project_name?: string;
  order_code?: string;
  receipt_code?: string;
};

export interface ReceiptItemDetail {
  receipt_item_id: string;
  receipt_id: string | null;
  order_item_id: string | null;
  qty: number;
  item_name?: string;
  unit?: string;
  vendor_name?: string;
}

export type ReceiptItemByOrder = ReceiptItemDetail & {
  receipt_date: string;
  receipt_code: string;
};

export interface ReceiptFilters {
  vendor_id?: string;
  project_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface ReceiptItemInput {
  order_item_id: string;
  qty: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

// Use Record<string, unknown> as TUpdate since receipts are not typically updated
type UpdateReceipt = Partial<Pick<Receipt, "order_id" | "receipt_date" | "receipt_code">>;

class ReceiptRepository extends BaseRepository<Receipt, CreateReceipt, UpdateReceipt> {
  constructor() {
    super(ReceiptModel);
  }

  /**
   * Get all receipts with summary info.
   */
  async findAllWithSummary(filters?: ReceiptFilters): Promise<ReceiptSummary[]> {
    try {
      const qb = new QueryBuilder()
        .select("r.receipt_id", "r.receipt_code", "r.order_id", "o.order_code", "r.receipt_date", "p.project_name")
        .selectRaw("COUNT(ri.receipt_item_id) as item_count")
        .selectRaw("GROUP_CONCAT(DISTINCT v.vendor_name) as vendor_names")
        .from("receipts", "r")
        .leftJoin("orders", "o", "o.order_id = r.order_id")
        .leftJoin("projects", "p", "p.project_id = o.project_id")
        .leftJoin("receipt_items", "ri", "ri.receipt_id = r.receipt_id")
        .leftJoin("order_items", "oi", "oi.order_item_id = ri.order_item_id")
        .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
        .withSoftDelete("r")
        .groupBy("r.receipt_id")
        .orderBy("r.receipt_date", "DESC")
        .orderBy("r.receipt_id", "DESC");

      if (filters?.vendor_id) {
        qb.where("oi.vendor_id", "=", filters.vendor_id);
      }
      if (filters?.project_id) {
        qb.where("o.project_id", "=", filters.project_id);
      }
      if (filters?.start_date) {
        qb.where("r.receipt_date", ">=", filters.start_date);
      }
      if (filters?.end_date) {
        qb.where("r.receipt_date", "<=", filters.end_date);
      }

      const { sql, params } = qb.build();
      const rows = await this.rawSelect<any>(sql, params);
      return rows.map((r) => ({
        ...r,
        vendor_names: r.vendor_names ? r.vendor_names.split(",").map((v: string) => v.trim()) : [],
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Get all items for a specific receipt.
   */
  async findItems(receiptId: string): Promise<ReceiptItemDetail[]> {
    const { sql, params } = new QueryBuilder()
      .select("ri.*", "i.item_name", "u.unit_name as unit", "v.vendor_name")
      .from("receipt_items", "ri")
      .leftJoin("order_items", "oi", "oi.order_item_id = ri.order_item_id")
      .leftJoin("items", "i", "i.item_id = oi.item_id")
      .leftJoin("units", "u", "i.unit_id = u.unit_id")
      .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
      .where("ri.receipt_id", "=", receiptId)
      .build();

    return this.rawSelect<ReceiptItemDetail>(sql, params);
  }

  /**
   * Get all receipt items for a specific Order (across all receipts).
   */
  async findItemsByOrder(orderId: string): Promise<ReceiptItemByOrder[]> {
    const { sql, params } = new QueryBuilder()
      .select("ri.*", "r.receipt_date", "r.receipt_code", "i.item_name", "u.unit_name as unit", "v.vendor_name")
      .from("receipt_items", "ri")
      .join("receipts", "r", "r.receipt_id = ri.receipt_id")
      .join("order_items", "oi", "oi.order_item_id = ri.order_item_id")
      .join("items", "i", "i.item_id = oi.item_id")
      .leftJoin("units", "u", "i.unit_id = u.unit_id")
      .leftJoin("vendors", "v", "v.vendor_id = oi.vendor_id")
      .where("oi.order_id", "=", orderId)
      .orderBy("r.receipt_date", "DESC")
      .orderBy("ri.receipt_item_id", "DESC")
      .build();

    return this.rawSelect<ReceiptItemByOrder>(sql, params);
  }

  /**
   * Create a receipt with its items.
   */
  async createWithItems(
    header: { order_id: string; receipt_date: string; receipt_code: string },
    items: ReceiptItemInput[],
  ): Promise<void> {
    return this.transaction(async () => {
      const receiptId = await this.create({
          receipt_code: header.receipt_code,
          receipt_date: header.receipt_date,
          order_id: header.order_id,
        }),
        itemsToInsert = items.filter((it) => it.qty > 0);
      if (itemsToInsert.length > 0) {
        const rows = itemsToInsert.map((it) => [this.generateId(), receiptId, it.order_item_id, it.qty]);
        await this.bulkInsert("receipt_items", ["receipt_item_id", "receipt_id", "order_item_id", "qty"], rows);
      }
    });
  }

  /**
   * Update a receipt and replace its items.
   */
  async updateWithItems(receiptId: string, header: UpdateReceipt, items: ReceiptItemInput[]): Promise<void> {
    return this.transaction(async () => {
      if (Object.keys(header).length > 0) {
        await this.update(receiptId, header);
      }

      await this.rawExecute("DELETE FROM receipt_items WHERE receipt_id = $1", [receiptId]);

      const itemsToInsert = items.filter((it) => it.qty > 0);
      if (itemsToInsert.length > 0) {
        const rows = itemsToInsert.map((it) => [this.generateId(), receiptId, it.order_item_id, it.qty]);
        await this.bulkInsert("receipt_items", ["receipt_item_id", "receipt_id", "order_item_id", "qty"], rows);
      }
    });
  }
}

export const receiptRepo = new ReceiptRepository();
