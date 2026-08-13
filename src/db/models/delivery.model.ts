import type { ModelDefinition } from "@/db/core/types";

export interface Delivery {
  delivery_id: number;
  po_id: number;
  delivery_date: string;
  deleted_at: string | null;
}

export type CreateDelivery = Pick<Delivery, "delivery_date" | "po_id">;

export const DeliveryModel: ModelDefinition = {
  tableName: "deliveries",
  primaryKey: "delivery_id",
  createColumns: ["po_id", "delivery_date"],
  updateColumns: ["po_id", "delivery_date"],
  softDelete: true,
};
