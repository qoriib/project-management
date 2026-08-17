/**
 * Project Repository — CRUD.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import {
  ProjectModel,
  type Project,
  type CreateProject,
  type UpdateProject,
} from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type ProjectWithRelations = Project & { has_relation?: boolean };

// ── Repository ───────────────────────────────────────────────────────────────

class ProjectRepository extends BaseRepository<Project, CreateProject, UpdateProject> {
  constructor() {
    super(ProjectModel);
  }

  /**
   * Get all projects and check if they have BOM or PO relations.
   */
  async findAllWithRelations(): Promise<ProjectWithRelations[]> {
    try {
      const pQb = new QueryBuilder()
        .select("p.*")
        .selectRaw("(EXISTS(SELECT 1 FROM bill_of_materials WHERE project_id = p.project_id AND deleted_at IS NULL) OR EXISTS(SELECT 1 FROM purchase_orders WHERE project_id = p.project_id AND deleted_at IS NULL)) as has_relation")
        .from("projects p")
        .where("p.deleted_at", "IS NULL")
        .orderBy("p.created_at", "DESC");
      
      const { sql, params } = pQb.build();
      const projects = await this.rawSelect<any>(sql, params);

      return projects.map((proj: any) => ({
        ...proj,
        has_relation: Boolean(proj.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const projectRepo = new ProjectRepository();
