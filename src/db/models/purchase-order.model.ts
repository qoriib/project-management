import type { ModelDefinition } from "@/db/core/types";

export interface PurchaseOrder {
  po_id: string;
  project_id: string;
  po_date: string;
  created_at: string;
  deleted_at: string | null;
}

export type CreatePurchaseOrder = Pick<PurchaseOrder, "po_date" | "project_id">;
export type UpdatePurchaseOrder = Partial<CreatePurchaseOrder>;

export const PurchaseOrderModel: ModelDefinition = {
  tableName: "purchase_orders",
  primaryKey: "po_id",
  createColumns: ["project_id", "po_date"],
  updateColumns: ["project_id", "po_date"],
  softDelete: true,
};
