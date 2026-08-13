import type { ModelDefinition } from "@/db/core/types";

export interface ItemPrice {
  price_id: number;
  item_id: number;
  price: number;
}

export type CreateItemPrice = Pick<ItemPrice, "item_id" | "price">;
export type UpdateItemPrice = Partial<Pick<ItemPrice, "price">>;

export const ItemPriceModel: ModelDefinition = {
  tableName: "item_prices",
  primaryKey: "price_id",
  createColumns: ["item_id", "price"],
  updateColumns: ["price"],
  softDelete: false,
};
