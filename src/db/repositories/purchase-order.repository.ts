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
  po_item_id: string;
  po_id: string | null;
  item_id: string | null;
  vendor_id: string | null;
  item_price_id: string;
  /** Resolved price from joined item_prices */
  price: number;
  qty: number;
  item_name?: string;
  unit?: string;
  vendor_name?: string;
  total_delivered?: number;
  remaining?: number;
};

export interface POFilters {
  project_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface POItemInput {
  po_item_id?: string;
  item_id: string | null;
  vendor_id: string | null;
  item_price_id: string;
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
          "p.project_name"
        )
        .selectRaw("GROUP_CONCAT(DISTINCT v.vendor_name) as vendor_names")
        .selectRaw("COALESCE(SUM(poi.qty * ip.price), 0) as total_price")
        .selectRaw("COUNT(poi.po_item_id) as item_count")
        .from("purchase_orders", "po")
        .leftJoin("projects", "p", "p.project_id = po.project_id")
        .leftJoin("po_items", "poi", "poi.po_id = po.po_id")
        .leftJoin("item_prices", "ip", "ip.item_price_id = poi.item_price_id")
        .leftJoin("vendors", "v", "v.vendor_id = poi.vendor_id")
        .withSoftDelete("po")
        .groupBy("po.po_id")
        .orderBy("po.po_date", "DESC")
        .orderBy("po.po_id", "DESC");

      if (filters?.project_id) {
        qb.where("po.project_id", "=", filters.project_id);
      }
      if (filters?.start_date) {
        qb.where("po.po_date", ">=", filters.start_date);
      }
      if (filters?.end_date) {
        qb.where("po.po_date", "<=", filters.end_date);
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
  async findByIdWithSummary(id: string): Promise<POWithSummary | null> {
    const { sql, params } = new QueryBuilder()
      .select(
        "po.po_id", "po.project_id", "po.po_date", "po.created_at",
        "p.project_name"
      )
      .selectRaw("GROUP_CONCAT(DISTINCT v.vendor_name) as vendor_names")
      .selectRaw("COALESCE(SUM(poi.qty * ip.price), 0) as total_price")
      .from("purchase_orders", "po")
      .leftJoin("projects", "p", "p.project_id = po.project_id")
      .leftJoin("po_items", "poi", "poi.po_id = po.po_id")
      .leftJoin("item_prices", "ip", "ip.item_price_id = poi.item_price_id")
      .leftJoin("vendors", "v", "v.vendor_id = poi.vendor_id")
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
  async findItems(poId: string): Promise<POItemDetail[]> {
    const { sql, params } = new QueryBuilder()
      .select(
        "poi.po_item_id", "poi.po_id", "poi.item_id", "poi.vendor_id",
        "poi.item_price_id", "poi.qty",
        "ip.price",
        "i.item_name", "u.unit_name as unit", "v.vendor_name"
      )
      .selectRaw("COALESCE(SUM(d.qty), 0) as total_delivered")
      .selectRaw("poi.qty - COALESCE(SUM(d.qty), 0) as remaining")
      .from("po_items", "poi")
      .leftJoin("item_prices", "ip", "ip.item_price_id = poi.item_price_id")
      .leftJoin("items", "i", "i.item_id = poi.item_id")
      .leftJoin("units", "u", "i.unit_id = u.unit_id")
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
  ): Promise<string> {
    return this.transaction(async () => {
      const poId = await this.create(po);

      const rows = items.map(it => [
        this.generateId(),
        poId,
        it.item_id ?? null,
        it.vendor_id ?? null,
        it.item_price_id,
        it.qty,
      ]);
      await this.bulkInsert("po_items", ["po_item_id", "po_id", "item_id", "vendor_id", "item_price_id", "qty"], rows);

      return poId;
    });
  }

  /**
   * Update a PO and sync its items (upsert + delete diff).
   */
  async updateWithItems(
    poId: string,
    po: UpdatePurchaseOrder,
    items: POItemInput[]
  ): Promise<void> {
    return this.transaction(async () => {
      // Update PO header
      await this.update(poId, po);

      // Sync items
      const existing = await this.rawSelect<{ po_item_id: string }>(
        "SELECT po_item_id FROM po_items WHERE po_id = $1",
        [poId]
      );
      const newIds = new Set(items.map((i) => i.po_item_id).filter(Boolean));
      const idsToDelete = existing.map((ex) => ex.po_item_id).filter((id) => !newIds.has(id));

      if (idsToDelete.length > 0) {
        const placeholders = idsToDelete.map((_, i) => `$${i + 1}`).join(",");
        await this.rawExecute(`DELETE FROM po_items WHERE po_item_id IN (${placeholders})`, idsToDelete);
      }

      const newItems = items.filter(it => !it.po_item_id);
      const existingItems = items.filter(it => it.po_item_id);

      if (newItems.length > 0) {
        const rows = newItems.map(it => [
          this.generateId(),
          poId,
          it.item_id ?? null,
          it.vendor_id ?? null,
          it.item_price_id,
          it.qty,
        ]);
        await this.bulkInsert("po_items", ["po_item_id", "po_id", "item_id", "vendor_id", "item_price_id", "qty"], rows);
      }

      for (const item of existingItems) {
        await this.rawExecute(
          "UPDATE po_items SET item_id = $1, vendor_id = $2, item_price_id = $3, qty = $4 WHERE po_item_id = $5",
          [item.item_id ?? null, item.vendor_id ?? null, item.item_price_id, item.qty, item.po_item_id]
        );
      }
    });
  }
}

export const purchaseOrderRepo = new PurchaseOrderRepository();
