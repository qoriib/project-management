import type { ModelDefinition } from "@/db/core/types";

export interface Order {
  order_id: string;
  project_id: string;
  order_code: string;
  order_date: string;
  created_at: string;
  deleted_at: string | null;
}

export type CreateOrder = Pick<Order, "order_date" | "project_id" | "order_code">;
export type UpdateOrder = Partial<CreateOrder>;

export const OrderModel: ModelDefinition = {
  createColumns: ["project_id", "order_date", "order_code"],
  primaryKey: "order_id",
  softDelete: true,
  tableName: "orders",
  updateColumns: ["project_id", "order_date", "order_code"],
};

