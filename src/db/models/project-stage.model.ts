import type { ModelDefinition } from "@/db/core/types";

export interface ProjectStage {
  stage_id: number;
  project_id: number;
  stage_name: string;
  created_at: string;
}

export type CreateProjectStage = Pick<ProjectStage, "project_id" | "stage_name">;
export type UpdateProjectStage = Partial<Pick<ProjectStage, "stage_name">>;

export const ProjectStageModel: ModelDefinition = {
  tableName: "project_stages",
  primaryKey: "stage_id",
  createColumns: ["project_id", "stage_name"],
  updateColumns: ["stage_name"],
  softDelete: false,
};
