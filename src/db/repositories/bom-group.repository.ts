import { BaseRepository } from "@/db/core/base-repository";
import {
  BOMGroupModel,
  type BOMGroup,
  type CreateBOMGroup,
  type UpdateBOMGroup,
} from "@/db/models";
import { QueryBuilder } from "@/db/core/query-builder";

export interface BOMGroupWithProject extends BOMGroup {
  project_name?: string;
}

class BOMGroupRepository extends BaseRepository<BOMGroup, CreateBOMGroup, UpdateBOMGroup> {
  constructor() {
    super(BOMGroupModel);
  }

  /**
   * Get all BOM Groups sorted alphabetically with project name.
   */
  async findAllSorted(): Promise<BOMGroupWithProject[]> {
    const qb = new QueryBuilder()
      .select("g.*", "p.project_name")
      .from(this.model.tableName, "g")
      .join("projects", "p", "g.project_id = p.project_id")
      .where("g.deleted_at", "IS NULL")
      .orderBy("g.group_name", "ASC");

    const { sql, params } = qb.build();
    return this.rawSelect<BOMGroupWithProject>(sql, params);
  }

  /**
   * Get BOM Groups for a specific project.
   */
  async findByProject(projectId: string): Promise<BOMGroup[]> {
    return this.findAll({
      where: { project_id: projectId },
      orderBy: { column: "group_name", direction: "ASC" },
    });
  }
}

export const bomGroupRepo = new BOMGroupRepository();
