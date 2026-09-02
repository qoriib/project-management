import { BaseRepository } from "@/db/core/base-repository";
import { RequirementModel, type Requirement, type CreateRequirement, type UpdateRequirement } from "@/db/models";

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

class RequirementRepository extends BaseRepository<Requirement, CreateRequirement, UpdateRequirement> {
  constructor() {
    super(RequirementModel);
  }

  /**
   * Get all Requirements with joined details (item, price variant, unit, category, project).
   */
  async findAllWithDetails(filters?: RequirementFilters): Promise<RequirementDetail[]> {
    const params: unknown[] = [];
    let whereClause = "WHERE requirements.deleted_at IS NULL";
    if (filters?.project_id) {
      whereClause += " AND requirements.project_id = $1";
      params.push(filters.project_id);
    }

    const sql = `
      SELECT requirements.requirement_id,
             requirements.project_id,
             requirements.item_id,
             requirements.item_price_id,
             requirements.qty,
             requirements.has_tax,
             requirements.created_at,
             item_prices.price,
             items.item_name,
             items.item_code,
             units.unit_name as unit,
             categories.category_name as category,
             categories.prefix as category_prefix,
             categories.category_code,
             projects.project_name,
             (requirements.qty * item_prices.price * (CASE WHEN requirements.has_tax = 1 THEN 1.12 ELSE 1.0 END)) as estimated_total
      FROM requirements
      LEFT JOIN item_prices ON item_prices.item_price_id = requirements.item_price_id AND item_prices.deleted_at IS NULL
      LEFT JOIN items ON items.item_id = requirements.item_id AND items.deleted_at IS NULL
      LEFT JOIN item_categories categories ON items.category_id = categories.category_id AND categories.deleted_at IS NULL
      LEFT JOIN units ON items.unit_id = units.unit_id AND units.deleted_at IS NULL
      LEFT JOIN projects ON projects.project_id = requirements.project_id AND projects.deleted_at IS NULL
      ${whereClause}
      ORDER BY requirements.requirement_id ASC
    `;

    return this.rawSelect<RequirementDetail>(sql, params);
  }
}

export const requirementRepo = new RequirementRepository();
