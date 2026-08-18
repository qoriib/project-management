import type { ModelDefinition } from "@/db/core/types";

export interface Delivery {
  delivery_id: string;
  po_id: string;
  delivery_code: string;
  delivery_date: string;
  deleted_at: string | null;
}

export type CreateDelivery = Pick<Delivery, "delivery_date" | "po_id" | "delivery_code">;

export const DeliveryModel: ModelDefinition = {
  tableName: "deliveries",
  primaryKey: "delivery_id",
  createColumns: ["po_id", "delivery_date", "delivery_code"],
  updateColumns: ["po_id", "delivery_date", "delivery_code"],
  softDelete: true,
};
