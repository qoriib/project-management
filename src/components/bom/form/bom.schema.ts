import type { BOMDetail } from "@/db/repositories";
import * as v from "valibot";

export const bomSchema = v.object({
  bom_group_id: v.pipe(v.string(), v.nonEmpty("Grup pekerjaan harus dipilih.")),
  item_id: v.pipe(v.string(), v.nonEmpty("Material harus dipilih.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih harga terlebih dahulu.")),
  qty: v.pipe(v.number(), v.minValue(0, "Volume tidak boleh negatif.")),
});

export interface BOMFormValues {
  bom_group_id: string;
  item_id: string;
  qty: number;
  item_price_id: string;
}

export function buildDefaultValues(
  initialData?: BOMDetail & { bom_group_id?: string },
  defaultGroupId?: string,
): BOMFormValues {
  const bom_group_id = initialData?.bom_group_id ?? defaultGroupId ?? "";
  const item_id = initialData?.item_id ?? "";
  const qty = initialData?.qty ? Number(initialData.qty) : 0;
  const item_price_id = initialData?.item_price_id ?? "";

  return { bom_group_id, item_id, item_price_id, qty };
}

export interface BOMFormProps {
  initialData?: BOMDetail;
  defaultGroupId?: string;
  onSuccess: () => void;
}
