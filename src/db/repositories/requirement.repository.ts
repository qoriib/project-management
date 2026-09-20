import { BaseRepository } from "@/db/core/base-repository";
import { RequirementModel, type Requirement, type CreateRequirement, type UpdateRequirement } from "@/db/models";

import { projectRepo } from "./project.repository";

export type RequirementDetail = Requirement & {
  price: number;
  item_name?: string;
  item_code?: string;
  category_prefix?: string;
  category_code?: string;
  unit?: string;
  project_name?: string;
  group_name?: string;
  category?: string;
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
   * Get all Requirements with joined details (item, price variant, unit, category, project, group).
   */
  async findAllWithDetails(filters?: RequirementFilters): Promise<RequirementDetail[]> {
    const rows = await this.query("requirements")
      .select(
        "requirements.requirement_id",
        "requirements.project_id",
        "requirements.requirement_group_id",
        "requirement_groups.group_name",
        "requirements.item_id",
        "requirements.item_price_id",
        "item_prices.price as price",
        "requirements.qty",
        "requirements.has_tax",
        "requirements.created_at",
        "items.item_name",
        "items.item_code",
        "units.unit_name as unit",
        "categories.category_name as category",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "projects.project_name",
      )
      .selectRaw(
        "(requirements.qty * item_prices.price * (CASE WHEN requirements.has_tax = 1 THEN 1.12 ELSE 1.0 END))",
        "estimated_total",
      )
      .leftJoin("requirement_groups", "requirement_groups.requirement_group_id = requirements.requirement_group_id")
      .leftJoin("items", "items.item_id = requirements.item_id")
      .leftJoin("item_prices", "item_prices.item_price_id = requirements.item_price_id")
      .leftJoin("item_categories", "categories", "items.category_id = categories.category_id")
      .leftJoin("units", "items.unit_id = units.unit_id")
      .leftJoin("projects", "projects.project_id = requirements.project_id")
      .when(Boolean(filters?.project_id), (q) => q.where("requirements.project_id", filters!.project_id))
      .orderBy("COALESCE(requirement_groups.requirement_group_id, '')", "ASC")
      .orderBy("requirements.requirement_id", "ASC")
      .getMany<RequirementDetail>();

    return rows.map((row) => ({
      ...row,
      has_tax: Boolean(row.has_tax),
    }));
  }

  /**
   * Validasi di sisi aplikasi bahwa proyek belum di-approve sebelum melakukan perubahan kebutuhan.
   */
  async ensureNotApproved(projectId: string): Promise<void> {
    const project = await projectRepo.findById(projectId);
    if (project?.requirements_is_approved) {
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
