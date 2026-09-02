import { BaseRepository } from "@/db/core/base-repository";
import { type CreateReceiptItem, type ReceiptItem, ReceiptItemModel } from "@/db/models";

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

export interface ReceiptItemInput {
  order_item_id: string;
  qty: number;
}

type UpdateReceiptItem = Partial<CreateReceiptItem>;

class ReceiptItemRepository extends BaseRepository<ReceiptItem, CreateReceiptItem, UpdateReceiptItem> {
  constructor() {
    super(ReceiptItemModel);
  }

  /**
   * Get all items for a specific receipt.
   */
  async findByReceipt(receiptId: string): Promise<ReceiptItemDetail[]> {
    const sql = `
      SELECT receipt_items.*,
             items.item_name,
             units.unit_name as unit,
             vendors.vendor_name
      FROM receipt_items
      LEFT JOIN order_items ON order_items.order_item_id = receipt_items.order_item_id
      LEFT JOIN items ON items.item_id = order_items.item_id AND items.deleted_at IS NULL
      LEFT JOIN units ON items.unit_id = units.unit_id AND units.deleted_at IS NULL
      LEFT JOIN vendors ON vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL
      WHERE receipt_items.receipt_id = $1
    `;

    return this.rawSelect<ReceiptItemDetail>(sql, [receiptId]);
  }

  /**
   * Get all receipt items for a specific Order (across all active receipts).
   */
  async findByOrder(orderId: string): Promise<ReceiptItemByOrder[]> {
    const sql = `
      SELECT receipt_items.*,
             receipts.receipt_date,
             receipts.receipt_code,
             items.item_name,
             units.unit_name as unit,
             vendors.vendor_name
      FROM receipt_items
      JOIN receipts ON receipts.receipt_id = receipt_items.receipt_id AND receipts.deleted_at IS NULL
      JOIN order_items ON order_items.order_item_id = receipt_items.order_item_id
      JOIN orders ON orders.order_id = order_items.order_id AND orders.deleted_at IS NULL
      JOIN items ON items.item_id = order_items.item_id AND items.deleted_at IS NULL
      LEFT JOIN units ON items.unit_id = units.unit_id AND units.deleted_at IS NULL
      LEFT JOIN vendors ON vendors.vendor_id = order_items.vendor_id AND vendors.deleted_at IS NULL
      WHERE order_items.order_id = $1
      ORDER BY receipts.receipt_date DESC, receipt_items.receipt_item_id DESC
    `;

    return this.rawSelect<ReceiptItemByOrder>(sql, [orderId]);
  }

  /**
   * Delete all items belonging to a specific receipt.
   */
  async deleteByReceipt(receiptId: string): Promise<number> {
    return this.deleteWhere({ receipt_id: receiptId }, false);
  }
}

export const receiptItemRepo = new ReceiptItemRepository();
