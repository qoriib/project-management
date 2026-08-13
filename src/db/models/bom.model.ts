import type { ModelDefinition } from "@/db/core/types";

export interface BillOfMaterial {
  bom_id: number;
  project_id: number;
  stage_id: number;
  item_id: number;
  item_price_id: number;
  qty: number;
  created_at: string;
  deleted_at: string | null;
}

export type CreateBOM = Pick<BillOfMaterial, "project_id" | "stage_id" | "item_id" | "item_price_id" | "qty">;
export type UpdateBOM = Partial<CreateBOM>;

export const BOMModel: ModelDefinition = {
  tableName: "bill_of_materials",
  primaryKey: "bom_id",
  createColumns: ["project_id", "stage_id", "item_id", "item_price_id", "qty"],
  updateColumns: ["project_id", "stage_id", "item_id", "item_price_id", "qty"],
  softDelete: true,
};
