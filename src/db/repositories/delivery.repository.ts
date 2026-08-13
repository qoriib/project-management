/**
 * Delivery Repository — Delivery/receipt management.
 */

import { BaseRepository } from "@/db/core/base-repository";
import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import {
  DeliveryModel,
  type Delivery,
  type CreateDelivery,
} from "@/db/models";

// ── Extended Types ───────────────────────────────────────────────────────────

export type DeliverySummary = Delivery & {
  item_count?: number;
  vendor_names?: string;
  project_name?: string;
};

export type DeliveryItemDetail = {
  delivery_item_id: number;
  delivery_id: number | null;
  po_item_id: number | null;
  qty: number;
  item_name?: string;
  unit?: string;
  vendor_name?: string;
};

export type DeliveryItemByPO = DeliveryItemDetail & {
  delivery_date: string;
};

export interface DeliveryFilters {
  vendor_id?: number;
  project_id?: number;
  tanggal_dari?: string;
  tanggal_sampai?: string;
}

export interface DeliveryItemInput {
  po_item_id: number;
  qty: number;
}

// ── Repository ───────────────────────────────────────────────────────────────

// Use Record<string, unknown> as TUpdate since deliveries are not typically updated
type UpdateDelivery = Partial<Pick<Delivery, "po_id" | "delivery_date">>;

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
        .select("d.delivery_id", "d.po_id", "d.delivery_date", "p.project_name")
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
      if (filters?.tanggal_dari) {
        qb.where("d.delivery_date", ">=", filters.tanggal_dari);
      }
      if (filters?.tanggal_sampai) {
        qb.where("d.delivery_date", "<=", filters.tanggal_sampai);
      }

      const { sql, params } = qb.build();
      return this.rawSelect<DeliverySummary>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Get all items for a specific delivery.
   */
  async findItems(deliveryId: number): Promise<DeliveryItemDetail[]> {
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
  async findItemsByPO(poId: number): Promise<DeliveryItemByPO[]> {
    const { sql, params } = new QueryBuilder()
      .select("di.*", "d.delivery_date", "i.item_name", "u.unit_name as unit", "v.vendor_name")
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
    header: { po_id: number; delivery_date: string },
    items: DeliveryItemInput[]
  ): Promise<void> {
    return this.transaction(async () => {
      const deliveryId = await this.create({
        po_id: header.po_id,
        delivery_date: header.delivery_date,
      });

      const itemsToInsert = items.filter(it => it.qty > 0);
      if (itemsToInsert.length > 0) {
        const rows = itemsToInsert.map(it => [deliveryId, it.po_item_id, it.qty]);
        await this.bulkInsert("delivery_items", ["delivery_id", "po_item_id", "qty"], rows);
      }
    });
  }
}

export const deliveryRepo = new DeliveryRepository();
