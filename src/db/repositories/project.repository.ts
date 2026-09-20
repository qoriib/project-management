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
    const rows = await this.query("projects")
      .select("projects.*")
      .selectRaw(
        `(EXISTS(SELECT 1 FROM requirements WHERE requirements.project_id = projects.project_id)
          OR EXISTS(SELECT 1 FROM orders WHERE orders.project_id = projects.project_id))`,
        "has_relation",
      )
      .orderBy("projects.project_id", "ASC")
      .getMany<Project & { has_relation: number | boolean }>();

    return rows.map((project) => ({
      ...project,
      has_relation: Boolean(project.has_relation),
    }));
  }
}

export const projectRepo = new ProjectRepository();
