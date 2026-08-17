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
  tableName: "bom_groups",
  primaryKey: "bom_group_id",
  createColumns: ["project_id", "group_name"],
  updateColumns: ["group_name"],
  softDelete: true,
};
