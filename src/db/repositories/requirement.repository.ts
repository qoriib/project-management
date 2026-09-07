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

    const rows = await this.rawSelect<RequirementDetail>(sql, params);
    return rows.map((r) => ({
      ...r,
      has_tax: Boolean(r.has_tax),
    }));
  }

  /**
   * Validasi di sisi aplikasi bahwa proyek belum di-approve sebelum melakukan perubahan kebutuhan.
   */
  async ensureNotApproved(projectId: string): Promise<void> {
    const db = await this.db();
    const rows = await db.select<{ requirements_is_approved: number }[]>(
      "SELECT requirements_is_approved FROM projects WHERE project_id = $1 AND deleted_at IS NULL",
      [projectId],
    );
    if (rows[0]?.requirements_is_approved === 1) {
      throw new Error("Gagal: Kebutuhan untuk proyek ini telah dikunci karena sudah disetujui.");
    }
  }

  override async create(data: CreateRequirement): Promise<string> {
    await this.ensureNotApproved(data.project_id);
    return super.create(data);
  }

  override async update(id: string, data: Partial<UpdateRequirement>): Promise<void> {
    const existing = await this.findById(id);
    if (existing) {
      await this.ensureNotApproved(existing.project_id);
    }
    return super.update(id, data);
  }

  override async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (existing) {
      await this.ensureNotApproved(existing.project_id);
    }
    return super.delete(id);
  }
}

export const requirementRepo = new RequirementRepository();
