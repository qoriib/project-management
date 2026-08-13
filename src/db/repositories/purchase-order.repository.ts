/**
 * Purchase Order Repository — PO management with item CRUD.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import {
  PurchaseOrderModel,
  type PurchaseOrder,
  type CreatePurchaseOrder,
  type UpdatePurchaseOrder,
} from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type POWithSummary = PurchaseOrder & {
  project_name?: string;
  total_price?: number;
  item_count?: number;
  vendor_names?: string;
};

export type POItemDetail = {
  po_item_id: number;
  po_id: number | null;
  item_id: number | null;
  item_price_id: number | null;
  vendor_id: number | null;
  qty: number;
  item_name?: string;
  unit?: string;
  price?: number;
  vendor_name?: string;
  total_terkirim?: number;
  sisa?: number;
};

export interface POFilters {
  project_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}

export interface POItemInput {
  po_item_id?: number;
  item_id: number | null;
  item_price_id: number | null;
  vendor_id: number | null;
  qty: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

class PurchaseOrderRepository extends BaseRepository<PurchaseOrder, CreatePurchaseOrder, UpdatePurchaseOrder> {
  constructor() {
    super(PurchaseOrderModel);
  }

  /**
   * Get all POs with summary (project name, total price, item count, vendor names).
   */
  async findAllWithSummary(filters?: POFilters): Promise<POWithSummary[]> {
    try {
      const qb = new QueryBuilder()
        .select(
          "po.po_id", "po.project_id", "po.po_date", "po.created_at",
          "p.project_name",
        )
        .selectRaw("COALESCE(SUM(poi.qty * ip.price), 0) as total_price")
        .selectRaw("COUNT(poi.po_item_id) as item_count")
        .selectRaw("GROUP_CONCAT(DISTINCT v.vendor_name) as vendor_names")
        .from("purchase_orders", "po")
        .leftJoin("projects", "p", "p.project_id = po.project_id")
        .leftJoin("po_items", "poi", "poi.po_id = po.po_id")
        .leftJoin("item_prices", "ip", "ip.price_id = poi.item_price_id")
        .leftJoin("vendors", "v", "v.vendor_id = poi.vendor_id")
        .withSoftDelete("po")
        .groupBy("po.po_id")
        .orderBy("po.po_date", "DESC")
        .orderBy("po.po_id", "DESC");

      if (filters?.project_id) {
        qb.where("po.project_id", "=", filters.project_id);
      }
      if (filters?.tanggal_dari) {
        qb.where("po.po_date", ">=", filters.tanggal_dari);
      }
      if (filters?.tanggal_sampai) {
        qb.where("po.po_date", "<=", filters.tanggal_sampai);
      }

      const { sql, params } = qb.build();
      return this.rawSelect<POWithSummary>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Get a single PO by ID with summary info.
   */
  async findByIdWithSummary(id: number): Promise<POWithSummary | null> {
    const { sql, params } = new QueryBuilder()
      .select(
        "po.po_id", "po.project_id", "po.po_date", "po.created_at",
        "p.project_name",
      )
      .selectRaw("COALESCE(SUM(poi.qty * ip.price), 0) as total_price")
      .from("purchase_orders", "po")
      .leftJoin("projects", "p", "p.project_id = po.project_id")
      .leftJoin("po_items", "poi", "poi.po_id = po.po_id")
      .leftJoin("item_prices", "ip", "ip.price_id = poi.item_price_id")
      .where("po.po_id", "=", id)
      .withSoftDelete("po")
      .groupBy("po.po_id")
      .build();

    const rows = await this.rawSelect<POWithSummary>(sql, params);
    return rows[0] ?? null;
  }

  /**
   * Get all items for a specific PO, with joined details.
   */
  async findItems(poId: number): Promise<POItemDetail[]> {
    const { sql, params } = new QueryBuilder()
      .select(
        "poi.po_item_id", "poi.po_id", "poi.item_id",
        "poi.item_price_id", "poi.vendor_id", "poi.qty",
        "i.item_name", "i.unit",
        "ip.price",
        "v.vendor_name",
      )
      .selectRaw("COALESCE(SUM(d.qty), 0) as total_terkirim")
      .selectRaw("poi.qty - COALESCE(SUM(d.qty), 0) as sisa")
      .from("po_items", "poi")
      .leftJoin("items", "i", "i.item_id = poi.item_id")
      .leftJoin("item_prices", "ip", "ip.price_id = poi.item_price_id")
      .leftJoin("vendors", "v", "v.vendor_id = poi.vendor_id")
      .leftJoin("delivery_items", "d", "d.po_item_id = poi.po_item_id")
      .where("poi.po_id", "=", poId)
      .groupBy("poi.po_item_id")
      .build();

    return this.rawSelect<POItemDetail>(sql, params);
  }

  /**
   * Create a PO with its items in a single operation.
   */
  async createWithItems(
    po: CreatePurchaseOrder,
    items: Omit<POItemInput, "po_item_id">[]
  ): Promise<number> {
    try {
      const poId = await this.create(po);

      for (const item of items) {
        await this.rawExecute(
          "INSERT INTO po_items (po_id, item_id, item_price_id, vendor_id, qty) VALUES ($1, $2, $3, $4, $5)",
          [poId, item.item_id ?? null, item.item_price_id ?? null, item.vendor_id ?? null, item.qty]
        );
      }

      return poId;
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Update a PO and sync its items (upsert + delete diff).
   */
  async updateWithItems(
    poId: number,
    po: UpdatePurchaseOrder,
    items: POItemInput[]
  ): Promise<void> {
    try {
      // Update PO header
      await this.update(poId, po);

      // Sync items
      const existing = await this.rawSelect<{ po_item_id: number }>(
        "SELECT po_item_id FROM po_items WHERE po_id = $1",
        [poId]
      );
      const newIds = new Set(items.map((i) => i.po_item_id).filter(Boolean));
      const idsToDelete = existing.map((ex) => ex.po_item_id).filter((id) => !newIds.has(id));

      // Delete removed items
      for (const id of idsToDelete) {
        await this.rawExecute("DELETE FROM po_items WHERE po_item_id = $1", [id]);
      }

      // Upsert items
      for (const item of items) {
        if (!item.po_item_id) {
          await this.rawExecute(
            "INSERT INTO po_items (po_id, item_id, item_price_id, vendor_id, qty) VALUES ($1, $2, $3, $4, $5)",
            [poId, item.item_id ?? null, item.item_price_id ?? null, item.vendor_id ?? null, item.qty]
          );
        } else {
          await this.rawExecute(
            "UPDATE po_items SET item_id = $1, item_price_id = $2, vendor_id = $3, qty = $4 WHERE po_item_id = $5",
            [item.item_id ?? null, item.item_price_id ?? null, item.vendor_id ?? null, item.qty, item.po_item_id]
          );
        }
      }
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
}

export const purchaseOrderRepo = new PurchaseOrderRepository();
