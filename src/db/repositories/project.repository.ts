import { BaseRepository } from "@/db/core/base-repository";
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
    const rows = await this.rawSelect<Project & { has_relation: number | boolean }>(
      `SELECT projects.*,
              (EXISTS(SELECT 1 FROM requirements WHERE project_id = projects.project_id AND deleted_at IS NULL) 
               OR EXISTS(SELECT 1 FROM orders WHERE project_id = projects.project_id AND deleted_at IS NULL)) as has_relation
       FROM projects
       WHERE projects.deleted_at IS NULL
       ORDER BY projects.project_id ASC`,
    );

    return rows.map((project) => ({
      ...project,
      has_relation: Boolean(project.has_relation),
    }));
  }
}

export const projectRepo = new ProjectRepository();
