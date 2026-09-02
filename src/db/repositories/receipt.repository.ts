import { BaseRepository } from "@/db/core/base-repository";
import { type CreateReceipt, type Receipt, ReceiptModel } from "@/db/models";
import {
  receiptItemRepo,
  type ReceiptItemByOrder,
  type ReceiptItemDetail,
  type ReceiptItemInput,
} from "./receipt-item.repository";

export type ReceiptSummary = Receipt & {
  item_count?: number;
  vendor_names?: string[];
  project_name?: string;
  order_code?: string;
};

export interface ReceiptFilters {
  vendor_id?: string;
  project_id?: string;
  start_date?: string;
  end_date?: string;
}

interface RawReceiptSummaryRow extends Receipt {
  item_count?: number;
  vendor_names?: string | null;
  project_name?: string;
  order_code?: string;
}

type UpdateReceipt = Partial<Pick<Receipt, "order_id" | "receipt_date" | "receipt_code">>;

export type { ReceiptItemByOrder, ReceiptItemDetail, ReceiptItemInput };

class ReceiptRepository extends BaseRepository<Receipt, CreateReceipt, UpdateReceipt> {
  constructor() {
    super(ReceiptModel);
  }

  /**
   * Get all receipts with summary info (item count, vendor names, project, order code).
   */
  async findAllWithSummary(filters?: ReceiptFilters): Promise<ReceiptSummary[]> {
    const params: unknown[] = [];
    let pIdx = 1;
    let whereSql = "WHERE receipts.deleted_at IS NULL";

    if (filters?.vendor_id) {
      whereSql += ` AND order_items.vendor_id = $${pIdx++}`;
      params.push(filters.vendor_id);
    }
    if (filters?.project_id) {
      whereSql += ` AND orders.project_id = $${pIdx++}`;
      params.push(filters.project_id);
    }
    if (filters?.start_date) {
      whereSql += ` AND receipts.receipt_date >= $${pIdx++}`;
      params.push(filters.start_date);
    }
    if (filters?.end_date) {
      whereSql += ` AND receipts.receipt_date <= $${pIdx++}`;
      params.push(filters.end_date);
    }

    const sql = `
      SELECT receipts.receipt_id,
             receipts.receipt_code,
             receipts.order_id,
             orders.order_code,
             receipts.receipt_date,
             projects.project_name,
             COUNT(receipt_items.receipt_item_id) as item_count,
             GROUP_CONCAT(DISTINCT vendors.vendor_name) as vendor_names
      FROM receipts
      LEFT JOIN orders ON orders.order_id = receipts.order_id AND orders.deleted_at IS NULL
      LEFT JOIN projects ON projects.project_id = orders.project_id AND projects.deleted_at IS NULL
      LEFT JOIN receipt_items ON receipt_items.receipt_id = receipts.receipt_id
      LEFT JOIN order_items ON order_items.order_item_id = receipt_items.order_item_id
      LEFT JOIN vendors ON vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL
      ${whereSql}
      GROUP BY receipts.receipt_id
      ORDER BY receipts.receipt_id ASC
    `;

    const rows = await this.rawSelect<RawReceiptSummaryRow>(sql, params);
    return rows.map((row) => ({
      ...row,
      vendor_names: row.vendor_names ? row.vendor_names.split(",").map((name) => name.trim()) : [],
    }));
  }

  /**
   * Get all items for a specific receipt.
   */
  async findItems(receiptId: string): Promise<ReceiptItemDetail[]> {
    return receiptItemRepo.findByReceipt(receiptId);
  }

  /**
   * Get all receipt items for a specific Order (across all active receipts).
   */
  async findItemsByOrder(orderId: string): Promise<ReceiptItemByOrder[]> {
    return receiptItemRepo.findByOrder(orderId);
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
      await receiptItemRepo.deleteByReceipt(receiptId);

      const validItems = items.filter((item) => item.qty > 0);
      if (validItems.length > 0) {
        const rows = validItems.map((item) => [this.generateId(), receiptId, item.order_item_id, item.qty]);
        await this.bulkInsert("receipt_items", ["receipt_item_id", "receipt_id", "order_item_id", "qty"], rows);
      }
    });
  }
}

export const receiptRepo = new ReceiptRepository();
