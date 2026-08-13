import type { ModelDefinition } from "@/db/core/types";

export interface Project {
  project_id: number;
  project_name: string;
  company_name: string;
  fiscal_year: number;
  created_at: string;
  deleted_at: string | null;
}

export type CreateProject = Pick<Project, "project_name" | "company_name" | "fiscal_year">;
export type UpdateProject = Partial<CreateProject>;

export const ProjectModel: ModelDefinition = {
  tableName: "projects",
  primaryKey: "project_id",
  createColumns: ["project_name", "company_name", "fiscal_year"],
  updateColumns: ["project_name", "company_name", "fiscal_year"],
  softDelete: true,
};
