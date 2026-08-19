import type { ModelDefinition } from "@/db/core/types";

export interface BOMGroup {
  bom_group_id: string;
  project_id: string;
  group_name: string;
  deleted_at: string | null;
}

export type CreateBOMGroup = Pick<BOMGroup, "project_id" | "group_name">;
export type UpdateBOMGroup = Partial<Pick<BOMGroup, "group_name">>;

export const BOMGroupModel: ModelDefinition = {
  createColumns: ["project_id", "group_name"],
  primaryKey: "bom_group_id",
  softDelete: true,
  tableName: "bom_groups",
  updateColumns: ["group_name"],
};
