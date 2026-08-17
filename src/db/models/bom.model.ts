import type { ModelDefinition } from "@/db/core/types";

export interface BillOfMaterial {
  bom_id: string;
  project_id: string;
  item_id: string;
  item_price_id: string;
  qty: number;
  created_at: string;
  deleted_at: string | null;
}

export type CreateBOM = Pick<BillOfMaterial, "project_id" | "item_id" | "item_price_id" | "qty">;
export type UpdateBOM = Partial<Pick<BillOfMaterial, "item_id" | "item_price_id" | "qty">>;

export const BOMModel: ModelDefinition = {
  tableName: "bill_of_materials",
  primaryKey: "bom_id",
  createColumns: ["project_id", "item_id", "item_price_id", "qty"],
  updateColumns: ["item_id", "item_price_id", "qty"],
  softDelete: true,
};
