import * as v from "valibot";

export const bomSchema = v.object({
  bom_group_id: v.pipe(v.string(), v.nonEmpty("Grup pekerjaan harus dipilih.")),
  item_id: v.pipe(v.string(), v.nonEmpty("Material harus dipilih.")),
  qty: v.pipe(v.number(), v.minValue(0, "Volume tidak boleh negatif.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih harga terlebih dahulu.")),
});

export type BOMFormValues = {
  bom_group_id: string;
  item_id: string;
  qty: number;
  item_price_id: string;
};

import type { BOMDetail } from "@/db/repositories";

export function buildDefaultValues(initialData?: BOMDetail & { bom_group_id?: string }, defaultGroupId?: string): BOMFormValues {
  const bom_group_id = initialData?.bom_group_id ?? defaultGroupId ?? "";
  const item_id = initialData?.item_id ?? "";
  const qty = initialData?.qty ? Number(initialData.qty) : 0;
  const item_price_id = initialData?.item_price_id ?? "";

  return { bom_group_id, item_id, qty, item_price_id };
}

export interface BOMFormProps {
  initialData?: BOMDetail;
  defaultGroupId?: string;
  onSuccess: () => void;
}
