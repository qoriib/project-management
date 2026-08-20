import type { ModelDefinition } from "@/db/core/types";

export interface BillOfMaterial {
  bom_id: string;
  project_id: string;
  bom_group_id: string;
  item_id: string;
  item_price_id: string;
  qty: number;
  created_at: string;
  deleted_at: string | null;
}

export type CreateBOM = Pick<
  BillOfMaterial,
  "project_id" | "bom_group_id" | "item_id" | "item_price_id" | "qty"
>;
export type UpdateBOM = Partial<
  Pick<BillOfMaterial, "bom_group_id" | "item_id" | "item_price_id" | "qty">
>;

export const BOMModel: ModelDefinition = {
  createColumns: [
    "project_id",
    "bom_group_id",
    "item_id",
    "item_price_id",
    "qty",
  ],
  primaryKey: "bom_id",
  softDelete: true,
  tableName: "bill_of_materials",
  updateColumns: ["bom_group_id", "item_id", "item_price_id", "qty"],
};
