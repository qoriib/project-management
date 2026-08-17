import * as v from "valibot";

export const bomSchema = v.object({
  item_id: v.pipe(v.string(), v.nonEmpty("Material harus dipilih.")),
  qty: v.pipe(v.number(), v.minValue(0.001, "Volume harus lebih dari 0.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih harga terlebih dahulu.")),
});

export type BOMFormValues = {
  item_id: string;
  qty: number;
  item_price_id: string;
};

import type { BOMDetail } from "@/db/repositories";

export function buildDefaultValues(initialData?: BOMDetail): BOMFormValues {
  const item_id = initialData?.item_id ?? "";
  const qty = initialData?.qty ? Number(initialData.qty) : 0;
  const item_price_id = initialData?.item_price_id ?? "";

  return { item_id, qty, item_price_id };
}

export interface BOMFormProps {
  initialData?: BOMDetail;
  isDisabled?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}
