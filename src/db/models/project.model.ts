import type { ModelDefinition } from "@/db/core/types";

export interface Project {
  project_id: string;
  project_name: string;
  company_name: string;
  fiscal_year: number;
  requirements_is_approved: number;
  created_at: string;
  deleted_at: string | null;
}

export type CreateProject = Pick<Project, "project_name" | "company_name" | "fiscal_year">;
export type UpdateProject = Partial<CreateProject & Pick<Project, "requirements_is_approved">>;

export const ProjectModel: ModelDefinition = {
  createColumns: ["project_name", "company_name", "fiscal_year"],
  primaryKey: "project_id",
  softDelete: true,
  tableName: "projects",
  updateColumns: ["project_name", "company_name", "fiscal_year", "requirements_is_approved"],
};
