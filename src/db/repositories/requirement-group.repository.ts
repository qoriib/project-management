import { BaseRepository } from "@/db/core/base-repository";
import {
  RequirementGroupModel,
  type RequirementGroup,
  type CreateRequirementGroup,
  type UpdateRequirementGroup,
} from "@/db/models";
import { projectRepo } from "./project.repository";

class RequirementGroupRepository extends BaseRepository<
  RequirementGroup,
  CreateRequirementGroup,
  UpdateRequirementGroup
> {
  constructor() {
    super(RequirementGroupModel);
  }

  /**
   * Mengambil seluruh kelompok kebutuhan untuk proyek tertentu.
   */
  async findByProject(projectId: string): Promise<RequirementGroup[]> {
    return this.findAll({
      orderBy: { column: "requirement_group_id", direction: "ASC" },
      where: { project_id: projectId },
    });
  }

  /**
   * Validasi di level aplikasi bahwa proyek belum di-approve sebelum melakukan perubahan kelompok kebutuhan.
   */
  async ensureNotApproved(projectId: string): Promise<void> {
    const project = await projectRepo.findById(projectId);
    if (project?.requirements_is_approved) {
      throw new Error("Gagal: Kebutuhan untuk proyek ini telah dikunci karena sudah disetujui.");
    }
  }

  override async create(data: CreateRequirementGroup): Promise<string> {
    await this.ensureNotApproved(data.project_id);
    return super.create(data);
  }

  override async update(id: string, data: Partial<UpdateRequirementGroup>): Promise<void> {
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

      const reqCount = await this.query("requirements").where("requirement_group_id", id).count();
      if (reqCount > 0) {
        throw new Error("Gagal: Kelompok pekerjaan masih digunakan oleh item kebutuhan.");
      }

      const orderCount = await this.query("orders").where("requirement_group_id", id).count();
      if (orderCount > 0) {
        throw new Error("Gagal: Kelompok pekerjaan masih digunakan oleh pesanan (PO).");
      }
    }
    return super.delete(id);
  }
}

export const requirementGroupRepo = new RequirementGroupRepository();
