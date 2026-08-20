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

interface RawReceiptSummaryRow extends Receipt {
  item_count?: number;
  vendor_names?: string | null;
  project_name?: string;
  order_code?: string;
}

type UpdateReceipt = Partial<Pick<Receipt, "order_id" | "receipt_date" | "receipt_code">>;

// ── Repository ───────────────────────────────────────────────────────────────

class ReceiptRepository extends BaseRepository<Receipt, CreateReceipt, UpdateReceipt> {
  constructor() {
    super(ReceiptModel);
  }

  /**
   * Get all receipts with summary info (item count, vendor names, project, order code).
   */
  async findAllWithSummary(filters?: ReceiptFilters): Promise<ReceiptSummary[]> {
    try {
      const query = new QueryBuilder()
        .select(
          "receipts.receipt_id",
          "receipts.receipt_code",
          "receipts.order_id",
          "orders.order_code",
          "receipts.receipt_date",
          "projects.project_name",
        )
        .selectRaw("COUNT(receipt_items.receipt_item_id) as item_count")
        .selectRaw("GROUP_CONCAT(DISTINCT vendors.vendor_name) as vendor_names")
        .from("receipts", "receipts")
        .leftJoin("orders", "orders", "orders.order_id = receipts.order_id")
        .leftJoin("projects", "projects", "projects.project_id = orders.project_id")
        .leftJoin("receipt_items", "receipt_items", "receipt_items.receipt_id = receipts.receipt_id")
        .leftJoin("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
        .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
        .withSoftDelete("receipts")
        .groupBy("receipts.receipt_id")
        .orderBy("receipts.receipt_date", "DESC")
        .orderBy("receipts.receipt_id", "DESC");

      if (filters?.vendor_id) {
        query.where("order_items.vendor_id", "=", filters.vendor_id);
      }
      if (filters?.project_id) {
        query.where("orders.project_id", "=", filters.project_id);
      }
      if (filters?.start_date) {
        query.where("receipts.receipt_date", ">=", filters.start_date);
      }
      if (filters?.end_date) {
        query.where("receipts.receipt_date", "<=", filters.end_date);
      }

      const { sql, params } = query.build();
      const rows = await this.rawSelect<RawReceiptSummaryRow>(sql, params);

      return rows.map((row) => ({
        ...row,
        vendor_names: row.vendor_names ? row.vendor_names.split(",").map((name) => name.trim()) : [],
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Get all items for a specific receipt.
   */
  async findItems(receiptId: string): Promise<ReceiptItemDetail[]> {
    const query = new QueryBuilder()
      .select("receipt_items.*", "items.item_name", "units.unit_name as unit", "vendors.vendor_name")
      .from("receipt_items", "receipt_items")
      .leftJoin("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .leftJoin("items", "items", "items.item_id = order_items.item_id")
      .leftJoin("units", "units", "items.unit_id = units.unit_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("receipt_items.receipt_id", "=", receiptId);

    const { sql, params } = query.build();
    return this.rawSelect<ReceiptItemDetail>(sql, params);
  }

  /**
   * Get all receipt items for a specific Order (across all receipts).
   */
  async findItemsByOrder(orderId: string): Promise<ReceiptItemByOrder[]> {
    const query = new QueryBuilder()
      .select(
        "receipt_items.*",
        "receipts.receipt_date",
        "receipts.receipt_code",
        "items.item_name",
        "units.unit_name as unit",
        "vendors.vendor_name",
      )
      .from("receipt_items", "receipt_items")
      .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .join("items", "items", "items.item_id = order_items.item_id")
      .leftJoin("units", "units", "items.unit_id = units.unit_id")
      .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("order_items.order_id", "=", orderId)
      .orderBy("receipts.receipt_date", "DESC")
      .orderBy("receipt_items.receipt_item_id", "DESC");

    const { sql, params } = query.build();
    return this.rawSelect<ReceiptItemByOrder>(sql, params);
  }

  /**
   * Create a receipt with its items in a single transaction.
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
      });

      const validItems = items.filter((item) => item.qty > 0);
      if (validItems.length > 0) {
        const rows = validItems.map((item) => [this.generateId(), receiptId, item.order_item_id, item.qty]);
        await this.bulkInsert("receipt_items", ["receipt_item_id", "receipt_id", "order_item_id", "qty"], rows);
      }
    });
  }

  /**
   * Update a receipt and replace its items.
   */
  async updateWithItems(
    receiptId: string,
    header: { receipt_date: string; receipt_code: string },
    items: ReceiptItemInput[],
  ): Promise<void> {
    return this.transaction(async () => {
      await this.update(receiptId, header);
      await this.rawExecute("DELETE FROM receipt_items WHERE receipt_id = $1", [receiptId]);

      const validItems = items.filter((item) => item.qty > 0);
      if (validItems.length > 0) {
        const rows = validItems.map((item) => [this.generateId(), receiptId, item.order_item_id, item.qty]);
        await this.bulkInsert("receipt_items", ["receipt_item_id", "receipt_id", "order_item_id", "qty"], rows);
      }
    });
  }
}

export const receiptRepo = new ReceiptRepository();
