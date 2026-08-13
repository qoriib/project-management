/**
 * Project Repository — CRUD + stage management.
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

export type ProjectWithStages = Project & { stages: string[] };

export interface StageRelation {
  stage_id: number;
  stage_name: string;
  has_relation: boolean;
}

export interface StageInput {
  stage_id?: number;
  stage_name: string;
}

// ── Repository ───────────────────────────────────────────────────────────────

class ProjectRepository extends BaseRepository<Project, CreateProject, UpdateProject> {
  constructor() {
    super(ProjectModel);
  }

  /**
   * Get all projects with their stage names attached.
   */
  async findAllWithStages(): Promise<ProjectWithStages[]> {
    try {
      const projects = await this.findAll({
        orderBy: { column: "created_at", direction: "DESC" },
      });

      const { sql, params } = new QueryBuilder()
        .select("ps.project_id", "ps.stage_name")
        .from("project_stages", "ps")
        .join("projects", "p", "p.project_id = ps.project_id")
        .where("p.deleted_at", "IS NULL")
        .build();

      const stages = await this.rawSelect<{ project_id: number; stage_name: string }>(sql, params);

      return projects.map((proj) => ({
        ...proj,
        stages: stages
          .filter((s) => s.project_id === proj.project_id)
          .map((s) => s.stage_name),
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Get stages for a project with info about whether they have BOM relations.
   */
  async getStagesWithRelation(projectId: number): Promise<StageRelation[]> {
    const { sql, params } = new QueryBuilder()
      .select("s.stage_id", "s.stage_name")
      .selectRaw("COUNT(b.bom_id) as count")
      .from("project_stages", "s")
      .leftJoin("bill_of_materials", "b", "s.stage_id = b.stage_id")
      .where("s.project_id", "=", projectId)
      .groupBy("s.stage_id")
      .build();

    const stages = await this.rawSelect<{ stage_id: number; stage_name: string; count: number }>(sql, params);

    return stages.map((s) => ({
      stage_id: s.stage_id,
      stage_name: s.stage_name,
      has_relation: s.count > 0,
    }));
  }

  /**
   * Sync project stages: update existing, create new, delete removed (if no BOM relations).
   */
  async saveStages(projectId: number, stages: StageInput[]): Promise<void> {
    return this.transaction(async () => {
      // Get existing stage IDs
      const existing = await this.rawSelect<{ stage_id: number }>(
        "SELECT stage_id FROM project_stages WHERE project_id = $1",
        [projectId]
      );
      const existingIds = existing.map((e) => e.stage_id);
      const newIds = stages.filter((s) => s.stage_id).map((s) => s.stage_id!);
      const idsToDelete = existingIds.filter((id) => !newIds.includes(id));

      // Delete removed stages (only if no BOM relations)
      for (const id of idsToDelete) {
        const rel = await this.rawSelect<{ count: number }>(
          "SELECT COUNT(*) as count FROM bill_of_materials WHERE stage_id = $1",
          [id]
        );
        if (rel[0].count === 0) {
          await this.rawExecute("DELETE FROM project_stages WHERE stage_id = $1", [id]);
        }
      }

      // Upsert stages
      const newStages = stages.filter(s => !s.stage_id);
      const existingStages = stages.filter(s => s.stage_id);

      if (newStages.length > 0) {
        const rows = newStages.map(s => [projectId, s.stage_name]);
        await this.bulkInsert("project_stages", ["project_id", "stage_name"], rows);
      }

      for (const stage of existingStages) {
        await this.rawExecute(
          "UPDATE project_stages SET stage_name = $1 WHERE stage_id = $2",
          [stage.stage_name, stage.stage_id]
        );
      }
    });
  }
}

export const projectRepo = new ProjectRepository();
