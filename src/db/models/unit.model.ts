import type { ModelDefinition } from "@/db/core/types";

export interface Unit {
  unit_id: string;
  unit_name: string;
  deleted_at: string | null;
}

export type CreateUnit = Pick<Unit, "unit_name">;
export type UpdateUnit = Partial<CreateUnit>;

export const UnitModel: ModelDefinition = {
  createColumns: ["unit_name"],
  primaryKey: "unit_id",
  softDelete: true,
  tableName: "units",
  updateColumns: ["unit_name"],
};
