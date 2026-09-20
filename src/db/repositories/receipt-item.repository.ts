import { BaseRepository } from "@/db/core/base-repository";
import { type CreateReceiptItem, type ReceiptItem, ReceiptItemModel } from "@/db/models";

export interface ReceiptItemDetail {
  receipt_item_id: string;
  receipt_id: string;
  order_item_id: string;
  item_price_id: string;
  price: number;
  qty: number;
  has_tax: boolean;
  item_id?: string;
  item_name?: string;
  item_code?: string;
  category_prefix?: string;
  category_code?: string;
  unit?: string;
  vendor_name?: string;
  ordered_qty?: number;
}

export type ReceiptItemByOrder = ReceiptItemDetail & {
  receipt_date: string;
  receipt_code: string | null;
};

export interface ReceiptItemInput {
  order_item_id: string;
  item_price_id: string;
  price?: number;
  qty: number;
  has_tax?: boolean;
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
    const rows = await this.query("receipt_items")
      .select(
        "receipt_items.receipt_item_id",
        "receipt_items.receipt_id",
        "receipt_items.order_item_id",
        "receipt_items.item_price_id",
        "item_prices.price as price",
        "receipt_items.qty",
        "receipt_items.has_tax",
        "order_items.item_id",
        "items.item_name",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "units.unit_name as unit",
        "vendors.vendor_name",
        "order_items.qty as ordered_qty",
      )
      .leftJoin("order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .leftJoin("item_prices", "item_prices.item_price_id = receipt_items.item_price_id")
      .leftJoin("items", "items.item_id = order_items.item_id")
      .leftJoin("item_categories", "categories", "categories.category_id = items.category_id")
      .leftJoin("units", "items.unit_id = units.unit_id")
      .leftJoin("vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("receipt_items.receipt_id", receiptId)
      .orderBy("receipt_items.receipt_item_id", "ASC")
      .getMany<ReceiptItemDetail>();

    return rows.map((row) => ({ ...row, has_tax: Boolean(row.has_tax) }));
  }

  /**
   * Get all receipt items for a specific Order (across all receipts).
   */
  async findByOrder(orderId: string): Promise<ReceiptItemByOrder[]> {
    const rows = await this.query("receipt_items")
      .select(
        "receipt_items.receipt_item_id",
        "receipt_items.receipt_id",
        "receipt_items.order_item_id",
        "receipt_items.item_price_id",
        "item_prices.price as price",
        "receipt_items.qty",
        "receipt_items.has_tax",
        "receipts.receipt_date",
        "receipts.receipt_code",
        "items.item_name",
        "units.unit_name as unit",
        "vendors.vendor_name",
      )
      .join("receipts", "receipts.receipt_id = receipt_items.receipt_id")
      .join("order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .leftJoin("item_prices", "item_prices.item_price_id = receipt_items.item_price_id")
      .leftJoin("items", "items.item_id = order_items.item_id")
      .leftJoin("units", "items.unit_id = units.unit_id")
      .leftJoin("vendors", "vendors.vendor_id = order_items.vendor_id")
      .where("order_items.order_id", orderId)
      .orderBy("receipts.receipt_date", "DESC")
      .orderBy("receipt_items.receipt_item_id", "DESC")
      .getMany<ReceiptItemByOrder>();

    return rows.map((row) => ({ ...row, has_tax: Boolean(row.has_tax) }));
  }

  /**
   * Delete all items belonging to a specific receipt.
   */
  async deleteByReceipt(receiptId: string): Promise<number> {
    return this.deleteWhere({ receipt_id: receiptId });
  }
}

export const receiptItemRepo = new ReceiptItemRepository();
