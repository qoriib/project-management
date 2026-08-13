/**
 * BOM (Bill of Materials) Repository — BOM management with stage queries.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import {
  BOMModel,
  type BillOfMaterial,
  type CreateBOM,
  type UpdateBOM,
  type ProjectStage,
} from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type ProjectStageWithProject = ProjectStage & {
  project_name?: string;
};

export type BOMDetail = BillOfMaterial & {
  item_name?: string;
  unit?: string;
  project_name?: string;
  stage_name?: string;
  category?: string;
  total_estimasi?: number;
};

export interface BOMFilters {
  project_id?: number;
  stage_id?: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

class BOMRepository extends BaseRepository<BillOfMaterial, CreateBOM, UpdateBOM> {
  constructor() {
    super(BOMModel);
  }

  /**
   * Get project stages for a project, with project name.
   */
  async findStagesByProject(projectId: number): Promise<ProjectStageWithProject[]> {
    const { sql, params } = new QueryBuilder()
      .select("ps.stage_id", "ps.project_id", "ps.stage_name", "ps.created_at", "p.project_name")
      .from("project_stages", "ps")
      .leftJoin("projects", "p", "p.project_id = ps.project_id")
      .where("ps.project_id", "=", projectId)
      .orderBy("ps.stage_id", "ASC")
      .build();

    return this.rawSelect<ProjectStageWithProject>(sql, params);
  }

  /**
   * Get all BOMs with joined details (item, price, project, stage).
   */
  async findAllWithDetails(filters?: BOMFilters): Promise<BOMDetail[]> {
    try {
      const qb = new QueryBuilder()
        .select(
          "b.bom_id", "b.project_id", "b.stage_id", "b.item_id",
          "b.price", "b.qty", "b.created_at",
          "i.item_name", "u.unit_name as unit", "c.category_name as category",
          "p.project_name", "ps.stage_name",
        )
        .selectRaw("(b.qty * b.price) as total_estimasi")
        .from("bill_of_materials", "b")
        .leftJoin("items", "i", "i.item_id = b.item_id")
        .leftJoin("item_categories", "c", "i.category_id = c.category_id")
        .leftJoin("units", "u", "i.unit_id = u.unit_id")
        .leftJoin("projects", "p", "p.project_id = b.project_id")
        .leftJoin("project_stages", "ps", "ps.stage_id = b.stage_id")
        .withSoftDelete("b")
        .orderBy("c.category_name", "ASC")
        .orderBy("i.item_name", "ASC");

      if (filters?.project_id) {
        qb.where("b.project_id", "=", filters.project_id);
      }
      if (filters?.stage_id) {
        qb.where("b.stage_id", "=", filters.stage_id);
      }

      const { sql, params } = qb.build();
      return this.rawSelect<BOMDetail>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const bomRepo = new BOMRepository();
