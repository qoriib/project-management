import { BaseRepository } from "@/db/core/base-repository";
import { type CreateReceipt, type Receipt, ReceiptModel } from "@/db/models";
import { generateNextCode } from "@/utils/formatters";
import {
  receiptItemRepo,
  type ReceiptItemByOrder,
  type ReceiptItemDetail,
  type ReceiptItemInput,
} from "./receipt-item.repository";

export type ReceiptSummary = Receipt & {
  item_count?: number;
  vendor_names?: string[];
  item_names?: string[];
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
  item_names?: string | null;
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
   * Get all receipts with summary info (item_count, vendor_names, item_names, project_name, order_code).
   */
  async findAllWithSummary(filters?: ReceiptFilters): Promise<ReceiptSummary[]> {
    const rows = await this.query("receipts")
      .select(
        "receipts.receipt_id",
        "receipts.receipt_code",
        "receipts.order_id",
        "orders.order_code",
        "receipts.receipt_date",
        "projects.project_name",
      )
      .selectCount("receipt_items.receipt_item_id", "item_count")
      .selectGroupConcat("vendors.vendor_name", "vendor_names", true)
      .selectGroupConcat("items.item_name", "item_names", true)
      .leftJoin("orders", "orders.order_id = receipts.order_id")
      .leftJoin("projects", "projects.project_id = orders.project_id")
      .leftJoin("receipt_items", "receipt_items.receipt_id = receipts.receipt_id")
      .leftJoin("order_items", "order_items.order_item_id = receipt_items.order_item_id")
      .leftJoin("items", "items.item_id = order_items.item_id")
      .leftJoin("vendors", "vendors.vendor_id = order_items.vendor_id")
      .when(Boolean(filters?.vendor_id), (builder) => builder.where("order_items.vendor_id", filters!.vendor_id))
      .when(Boolean(filters?.project_id), (builder) => builder.where("orders.project_id", filters!.project_id))
      .when(Boolean(filters?.start_date), (builder) =>
        builder.where("receipts.receipt_date", ">=", filters!.start_date),
      )
      .when(Boolean(filters?.end_date), (builder) => builder.where("receipts.receipt_date", "<=", filters!.end_date))
      .groupBy("receipts.receipt_id")
      .orderBy("receipts.receipt_date", "DESC")
      .orderBy("receipts.receipt_id", "DESC")
      .getMany<RawReceiptSummaryRow>();

    return rows.map((row) => ({
      ...row,
      vendor_names: row.vendor_names ? row.vendor_names.split(",").map((name) => name.trim()) : [],
      item_names: row.item_names ? row.item_names.split(",").map((name) => name.trim()) : [],
    }));
  }

  /**
   * Get all items for a specific receipt.
   */
  async findItems(receiptId: string): Promise<ReceiptItemDetail[]> {
    return receiptItemRepo.findByReceipt(receiptId);
  }

  /**
   * Get all receipt items for a specific Order (across all receipts).
   */
  async findItemsByOrder(orderId: string): Promise<ReceiptItemByOrder[]> {
    return receiptItemRepo.findByOrder(orderId);
  }

  /**
   * Create a receipt with its items.
   */
  async createWithItems(
    header: { order_id: string; receipt_date: string; receipt_code: string },
    items: ReceiptItemInput[],
  ): Promise<void> {
    const receiptId = await this.create({
      receipt_code: header.receipt_code,
      receipt_date: header.receipt_date,
      order_id: header.order_id,
    });

    const validItems = items.filter((item) => item.qty > 0);
    if (validItems.length > 0) {
      const rows = validItems.map((item) => [
        this.generateId(),
        receiptId,
        item.order_item_id,
        item.item_price_id,
        item.qty,
        item.has_tax ? 1 : 0,
      ]);
      await this.bulkInsert(
        "receipt_items",
        ["receipt_item_id", "receipt_id", "order_item_id", "item_price_id", "qty", "has_tax"],
        rows,
      );
    }
  }

  /**
   * Menghasilkan kode penerimaan berikutnya secara sekuensial (NP-00001, dsb).
   */
  async getNextCode(projectId?: string): Promise<string> {
    const receipts = await this.findAllWithSummary({ project_id: projectId });
    return generateNextCode(
      receipts.map((receipt) => receipt.receipt_code),
      "NP-",
    );
  }

  /**
   * Membuat penerimaan kosong langsung untuk pesanan (PO) terkait.
   */
  async createForOrder(orderId: string, projectId?: string): Promise<string> {
    const nextCode = await this.getNextCode(projectId);
    const today = new Date().toISOString().split("T")[0];
    return this.create({
      receipt_code: nextCode,
      receipt_date: today,
      order_id: orderId,
    });
  }

  /**
   * Add a single item to a receipt.
   */
  async createItem(receiptId: string, item: ReceiptItemInput): Promise<string> {
    return receiptItemRepo.create({
      receipt_id: receiptId,
      order_item_id: item.order_item_id,
      item_price_id: item.item_price_id,
      qty: item.qty,
      has_tax: item.has_tax ?? false,
    });
  }

  /**
   * Update an existing item in a receipt.
   */
  async updateItem(receiptItemId: string, item: ReceiptItemInput): Promise<void> {
    await receiptItemRepo.update(receiptItemId, {
      order_item_id: item.order_item_id,
      item_price_id: item.item_price_id,
      qty: item.qty,
      has_tax: item.has_tax ?? false,
    });
  }

  /**
   * Delete a single receipt item.
   */
  async deleteItem(receiptItemId: string): Promise<void> {
    await receiptItemRepo.delete(receiptItemId);
  }

  /**
   * Upsert a single receipt item by order_item_id.
   * If qty > 0, insert or update the record.
   * If qty <= 0, delete the record.
   */
  async upsertItem(
    receiptId: string,
    orderItemId: string,
    item_price_id: string,
    qty: number,
    has_tax = false,
  ): Promise<void> {
    const existing = await receiptItemRepo.findOne({
      receipt_id: receiptId,
      order_item_id: orderItemId,
    });

    if (qty > 0) {
      if (existing) {
        await receiptItemRepo.update(existing.receipt_item_id, {
          item_price_id,
          qty,
          has_tax,
        });
      } else {
        await receiptItemRepo.create({
          receipt_id: receiptId,
          order_item_id: orderItemId,
          item_price_id,
          qty,
          has_tax,
        });
      }
    } else if (existing) {
      await receiptItemRepo.delete(existing.receipt_item_id);
    }
  }

  /**
   * Delete a receipt and hard-delete its receipt_items (FK cascade handles this automatically,
   * but explicit delete ensures no orphans from FK restrict scenarios).
   */
  override async delete(id: string): Promise<void> {
    await receiptItemRepo.deleteWhere({ receipt_id: id });
    await super.delete(id);
  }
}

export const receiptRepo = new ReceiptRepository();
