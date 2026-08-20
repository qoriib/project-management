/**
 * Delivery Repository — Delivery/receipt management.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import { type CreateDelivery, type Delivery, DeliveryModel } from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type DeliverySummary = Delivery & {
  item_count?: number;
  vendor_names?: string[];
  project_name?: string;
  po_code?: string;
  delivery_code?: string;
};

export interface DeliveryItemDetail {
  delivery_item_id: string;
  delivery_id: string | null;
  po_item_id: string | null;
  qty: number;
  item_name?: string;
  unit?: string;
  vendor_name?: string;
}

export type DeliveryItemByPO = DeliveryItemDetail & {
  delivery_date: string;
  delivery_code: string;
};

export interface DeliveryFilters {
  vendor_id?: string;
  project_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface DeliveryItemInput {
  po_item_id: string;
  qty: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

// Use Record<string, unknown> as TUpdate since deliveries are not typically updated
type UpdateDelivery = Partial<Pick<Delivery, "po_id" | "delivery_date" | "delivery_code">>;

class DeliveryRepository extends BaseRepository<Delivery, CreateDelivery, UpdateDelivery> {
  constructor() {
    super(DeliveryModel);
  }

  /**
   * Get all deliveries with summary info.
   */
  async findAllWithSummary(filters?: DeliveryFilters): Promise<DeliverySummary[]> {
    try {
      const qb = new QueryBuilder()
        .select("d.delivery_id", "d.delivery_code", "d.po_id", "po.po_code", "d.delivery_date", "p.project_name")
        .selectRaw("COUNT(di.delivery_item_id) as item_count")
        .selectRaw("GROUP_CONCAT(DISTINCT v.vendor_name) as vendor_names")
        .from("deliveries", "d")
        .leftJoin("purchase_orders", "po", "po.po_id = d.po_id")
        .leftJoin("projects", "p", "p.project_id = po.project_id")
        .leftJoin("delivery_items", "di", "di.delivery_id = d.delivery_id")
        .leftJoin("po_items", "poi", "poi.po_item_id = di.po_item_id")
        .leftJoin("vendors", "v", "v.vendor_id = poi.vendor_id")
        .withSoftDelete("d")
        .groupBy("d.delivery_id")
        .orderBy("d.delivery_date", "DESC")
        .orderBy("d.delivery_id", "DESC");

      if (filters?.vendor_id) {
        qb.where("poi.vendor_id", "=", filters.vendor_id);
      }
      if (filters?.project_id) {
        qb.where("po.project_id", "=", filters.project_id);
      }
      if (filters?.start_date) {
        qb.where("d.delivery_date", ">=", filters.start_date);
      }
      if (filters?.end_date) {
        qb.where("d.delivery_date", "<=", filters.end_date);
      }

      const { sql, params } = qb.build();
      const rows = await this.rawSelect<any>(sql, params);
      return rows.map((r) => ({
        ...r,
        vendor_names: r.vendor_names ? r.vendor_names.split(",").map((v: string) => v.trim()) : [],
      }));
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Get all items for a specific delivery.
   */
  async findItems(deliveryId: string): Promise<DeliveryItemDetail[]> {
    const { sql, params } = new QueryBuilder()
      .select("di.*", "i.item_name", "u.unit_name as unit", "v.vendor_name")
      .from("delivery_items", "di")
      .leftJoin("po_items", "poi", "poi.po_item_id = di.po_item_id")
      .leftJoin("items", "i", "i.item_id = poi.item_id")
      .leftJoin("units", "u", "i.unit_id = u.unit_id")
      .leftJoin("vendors", "v", "v.vendor_id = poi.vendor_id")
      .where("di.delivery_id", "=", deliveryId)
      .build();

    return this.rawSelect<DeliveryItemDetail>(sql, params);
  }

  /**
   * Get all delivery items for a specific PO (across all deliveries).
   */
  async findItemsByPO(poId: string): Promise<DeliveryItemByPO[]> {
    const { sql, params } = new QueryBuilder()
      .select("di.*", "d.delivery_date", "d.delivery_code", "i.item_name", "u.unit_name as unit", "v.vendor_name")
      .from("delivery_items", "di")
      .join("deliveries", "d", "d.delivery_id = di.delivery_id")
      .join("po_items", "poi", "poi.po_item_id = di.po_item_id")
      .join("items", "i", "i.item_id = poi.item_id")
      .leftJoin("units", "u", "i.unit_id = u.unit_id")
      .leftJoin("vendors", "v", "v.vendor_id = poi.vendor_id")
      .where("poi.po_id", "=", poId)
      .orderBy("d.delivery_date", "DESC")
      .orderBy("di.delivery_item_id", "DESC")
      .build();

    return this.rawSelect<DeliveryItemByPO>(sql, params);
  }

  /**
   * Create a delivery with its items.
   */
  async createWithItems(
    header: { po_id: string; delivery_date: string; delivery_code: string },
    items: DeliveryItemInput[],
  ): Promise<void> {
    return this.transaction(async () => {
      const deliveryId = await this.create({
          delivery_code: header.delivery_code,
          delivery_date: header.delivery_date,
          po_id: header.po_id,
        }),
        itemsToInsert = items.filter((it) => it.qty > 0);
      if (itemsToInsert.length > 0) {
        const rows = itemsToInsert.map((it) => [this.generateId(), deliveryId, it.po_item_id, it.qty]);
        await this.bulkInsert("delivery_items", ["delivery_item_id", "delivery_id", "po_item_id", "qty"], rows);
      }
    });
  }

  /**
   * Update a delivery and replace its items.
   */
  async updateWithItems(deliveryId: string, header: UpdateDelivery, items: DeliveryItemInput[]): Promise<void> {
    return this.transaction(async () => {
      if (Object.keys(header).length > 0) {
        await this.update(deliveryId, header);
      }

      await this.rawExecute("DELETE FROM delivery_items WHERE delivery_id = $1", [deliveryId]);

      const itemsToInsert = items.filter((it) => it.qty > 0);
      if (itemsToInsert.length > 0) {
        const rows = itemsToInsert.map((it) => [this.generateId(), deliveryId, it.po_item_id, it.qty]);
        await this.bulkInsert("delivery_items", ["delivery_item_id", "delivery_id", "po_item_id", "qty"], rows);
      }
    });
  }
}

export const deliveryRepo = new DeliveryRepository();
