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
   * Get all Requirements with joined details (item, price variant, unit, category, project).
   */
  async findAllWithDetails(filters?: RequirementFilters): Promise<RequirementDetail[]> {
    try {
      const query = new QueryBuilder()
        .select(
          "requirements.requirement_id",
          "requirements.project_id",
          "requirements.item_id",
          "requirements.item_price_id",
          "requirements.qty",
          "requirements.has_tax",
          "requirements.created_at",
          "item_prices.price",
          "items.item_name",
          "items.item_code",
          "units.unit_name as unit",
          "categories.category_name as category",
          "categories.prefix as category_prefix",
          "categories.category_code",
          "projects.project_name",
        )
        .selectRaw(
          "(requirements.qty * item_prices.price * (CASE WHEN requirements.has_tax = 1 THEN 1.12 ELSE 1.0 END)) as estimated_total",
        )
        .from("requirements", "requirements")
        .leftJoin("item_prices", "item_prices", "item_prices.item_price_id = requirements.item_price_id")
        .leftJoin("items", "items", "items.item_id = requirements.item_id")
        .leftJoin("item_categories", "categories", "items.category_id = categories.category_id")
        .leftJoin("units", "units", "items.unit_id = units.unit_id")
        .leftJoin("projects", "projects", "projects.project_id = requirements.project_id")
        .withSoftDelete("requirements")
        .orderBy("requirements.requirement_id", "ASC");

      if (filters?.project_id) {
        query.where("requirements.project_id", "=", filters.project_id);
      }

      const { sql, params } = query.build();
      return await this.rawSelect<RequirementDetail>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const requirementRepo = new RequirementRepository();
