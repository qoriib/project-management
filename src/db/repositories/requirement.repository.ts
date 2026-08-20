/**
 * Requirement Repository — Requirement management.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import { RequirementModel, type Requirement, type CreateRequirement, type UpdateRequirement } from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type RequirementDetail = Requirement & {
  item_name?: string;
  item_code?: string;
  category_prefix?: string;
  category_code?: string;
  unit?: string;
  project_name?: string;
  category?: string;
  /** Resolved price value from item_prices join */
  price?: number;
  estimated_total?: number;
};

export interface RequirementFilters {
  project_id?: string;
}

// ── Repository ───────────────────────────────────────────────────────────────

class RequirementRepository extends BaseRepository<Requirement, CreateRequirement, UpdateRequirement> {
  constructor() {
    super(RequirementModel);
  }

  /**
   * Get all Requirements with joined details (item, price variant, project).
   */
  async findAllWithDetails(filters?: RequirementFilters): Promise<RequirementDetail[]> {
    try {
      const qb = new QueryBuilder()
        .select(
          "r.requirement_id",
          "r.project_id",
          "r.item_id",
          "r.item_price_id",
          "r.qty",
          "r.has_tax",
          "r.created_at",
          "ip.price",
          "i.item_name",
          "i.item_code",
          "u.unit_name as unit",
          "c.category_name as category",
          "c.prefix as category_prefix",
          "c.category_code",
          "p.project_name",
        )
        .selectRaw("(r.qty * ip.price * (CASE WHEN r.has_tax = 1 THEN 1.12 ELSE 1.0 END)) as estimated_total")
        .from("requirements", "r")
        .leftJoin("item_prices", "ip", "ip.item_price_id = r.item_price_id")
        .leftJoin("items", "i", "i.item_id = r.item_id")
        .leftJoin("item_categories", "c", "i.category_id = c.category_id")
        .leftJoin("units", "u", "i.unit_id = u.unit_id")
        .leftJoin("projects", "p", "p.project_id = r.project_id")
        .withSoftDelete("r")
        .orderBy("i.item_name", "ASC");

      if (filters?.project_id) {
        qb.where("r.project_id", "=", filters.project_id);
      }

      const { sql, params } = qb.build();
      return this.rawSelect<RequirementDetail>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const requirementRepo = new RequirementRepository();
