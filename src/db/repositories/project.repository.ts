import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import { type CreateProject, type Project, ProjectModel, type UpdateProject } from "@/db/models";

export type ProjectWithRelations = Project & { has_relation?: boolean };

class ProjectRepository extends BaseRepository<Project, CreateProject, UpdateProject> {
  constructor() {
    super(ProjectModel);
  }

  /**
   * Get all projects and check if they have BOM or PO relations.
   */
  async findAllWithRelations(): Promise<ProjectWithRelations[]> {
    try {
      const query = new QueryBuilder()
        .select("projects.*")
        .selectRaw(
          `(EXISTS(SELECT 1 FROM requirements WHERE project_id = projects.project_id AND deleted_at IS NULL) 
            OR EXISTS(SELECT 1 FROM orders WHERE project_id = projects.project_id AND deleted_at IS NULL)) as has_relation`,
        )
        .from("projects", "projects")
        .where("projects.deleted_at", "IS NULL")
        .orderBy("projects.created_at", "DESC");

      const { sql, params } = query.build();
      const rows = await this.rawSelect<ProjectWithRelations & { has_relation: number | boolean }>(sql, params);

      return rows.map((project) => ({
        ...project,
        has_relation: Boolean(project.has_relation),
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const projectRepo = new ProjectRepository();
