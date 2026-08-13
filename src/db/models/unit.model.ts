import type { ModelDefinition } from "@/db/core/types";

export interface Unit {
  unit_id: number;
  unit_name: string;
  deleted_at: string | null;
}

export type CreateUnit = Pick<Unit, "unit_name">;
export type UpdateUnit = Partial<CreateUnit>;

export const UnitModel: ModelDefinition = {
  tableName: "units",
  primaryKey: "unit_id",
  createColumns: ["unit_name"],
  updateColumns: ["unit_name"],
  softDelete: true,
};
