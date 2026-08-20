import type { RequirementDetail } from "@/db/repositories";
import * as v from "valibot";

export const requirementSchema = v.object({
  item_id: v.pipe(v.string(), v.nonEmpty("Material harus dipilih.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih harga terlebih dahulu.")),
  qty: v.pipe(v.number(), v.minValue(0, "Volume tidak boleh negatif.")),
});

export interface RequirementFormValues {
  item_id: string;
  qty: number;
  item_price_id: string;
}

export function buildDefaultValues(initialData?: RequirementDetail): RequirementFormValues {
  return {
    item_id: initialData?.item_id ?? "",
    qty: initialData?.qty ? Number(initialData.qty) : 0,
    item_price_id: initialData?.item_price_id ?? "",
  };
}

export interface RequirementFormProps {
  initialData?: RequirementDetail;
  onSuccess: () => void;
}
