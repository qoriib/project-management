import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
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
    try {
      const query = new QueryBuilder()
        .select("receipt_items.*", "items.item_name", "units.unit_name as unit", "vendors.vendor_name")
        .from("receipt_items", "receipt_items")
        .leftJoin("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
        .leftJoin("items", "items", "items.item_id = order_items.item_id")
        .leftJoin("units", "units", "items.unit_id = units.unit_id")
        .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
        .where("receipt_items.receipt_id", "=", receiptId);

      const { sql, params } = query.build();
      return await this.rawSelect<ReceiptItemDetail>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Get all receipt items for a specific Order (across all active receipts).
   */
  async findByOrder(orderId: string): Promise<ReceiptItemByOrder[]> {
    try {
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
        .join("receipts", "receipts", "receipts.receipt_id = receipt_items.receipt_id AND receipts.deleted_at IS NULL")
        .join("order_items", "order_items", "order_items.order_item_id = receipt_items.order_item_id")
        .join("orders", "orders", "orders.order_id = order_items.order_id AND orders.deleted_at IS NULL")
        .join("items", "items", "items.item_id = order_items.item_id")
        .leftJoin("units", "units", "items.unit_id = units.unit_id")
        .leftJoin("vendors", "vendors", "vendors.vendor_id = order_items.vendor_id")
        .where("order_items.order_id", "=", orderId)
        .orderBy("receipts.receipt_date", "DESC")
        .orderBy("receipt_items.receipt_item_id", "DESC");

      const { sql, params } = query.build();
      return await this.rawSelect<ReceiptItemByOrder>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Delete all items belonging to a specific receipt.
   */
  async deleteByReceipt(receiptId: string): Promise<number> {
    return this.deleteWhere({ receipt_id: receiptId }, false);
  }
}

export const receiptItemRepo = new ReceiptItemRepository();
