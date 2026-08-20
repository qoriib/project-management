import type { ModelDefinition } from "@/db/core/types";

export interface Receipt {
  receipt_id: string;
  order_id: string;
  receipt_code: string;
  receipt_date: string;
  deleted_at: string | null;
}

export type CreateReceipt = Pick<Receipt, "receipt_date" | "order_id" | "receipt_code">;

export const ReceiptModel: ModelDefinition = {
  createColumns: ["order_id", "receipt_date", "receipt_code"],
  primaryKey: "receipt_id",
  softDelete: true,
  tableName: "receipts",
  updateColumns: ["order_id", "receipt_date", "receipt_code"],
};
