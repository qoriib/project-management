import type { ModelDefinition } from "@/db/core/types";

export interface ItemPrice {
  item_price_id: string;
  item_id: string;
  price: number;
  deleted_at: string | null;
}

export type CreateItemPrice = Pick<ItemPrice, "item_id" | "price">;
export type UpdateItemPrice = Partial<Pick<ItemPrice, "price">>;

export const ItemPriceModel: ModelDefinition = {
  createColumns: ["item_id", "price"],
  primaryKey: "item_price_id",
  softDelete: true,
  tableName: "item_prices",
  updateColumns: ["price"],
};
