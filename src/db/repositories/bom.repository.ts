/**
 * BOM (Bill of Materials) Repository — BOM management.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import {
  BOMModel,
  type BillOfMaterial,
  type CreateBOM,
  type UpdateBOM,
} from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type BOMDetail = BillOfMaterial & {
  item_name?: string;
  unit?: string;
  project_name?: string;
  category?: string;
  /** Resolved price value from item_prices join */
  price?: number;
  estimated_total?: number;
};

export interface BOMFilters {
  project_id?: string;
}

// ── Repository ───────────────────────────────────────────────────────────────

class BOMRepository extends BaseRepository<BillOfMaterial, CreateBOM, UpdateBOM> {
  constructor() {
    super(BOMModel);
  }

  /**
   * Get all BOMs with joined details (item, price variant, project).
   */
  async findAllWithDetails(filters?: BOMFilters): Promise<BOMDetail[]> {
    try {
      const qb = new QueryBuilder()
        .select(
          "b.bom_id", "b.project_id", "b.item_id",
          "b.item_price_id", "b.qty", "b.created_at",
          "ip.price",
          "i.item_name", "u.unit_name as unit", "c.category_name as category",
          "p.project_name"
        )
        .selectRaw("(b.qty * ip.price) as estimated_total")
        .from("bill_of_materials", "b")
        .leftJoin("item_prices", "ip", "ip.item_price_id = b.item_price_id")
        .leftJoin("items", "i", "i.item_id = b.item_id")
        .leftJoin("item_categories", "c", "i.category_id = c.category_id")
        .leftJoin("units", "u", "i.unit_id = u.unit_id")
        .leftJoin("projects", "p", "p.project_id = b.project_id")
        .withSoftDelete("b")
        .orderBy("c.category_name", "ASC")
        .orderBy("i.item_name", "ASC");

      if (filters?.project_id) {
        qb.where("b.project_id", "=", filters.project_id);
      }

      const { sql, params } = qb.build();
      return this.rawSelect<BOMDetail>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const bomRepo = new BOMRepository();
