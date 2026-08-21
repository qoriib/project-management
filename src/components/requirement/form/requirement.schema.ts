import type { RequirementDetail } from "@/db/repositories";
import * as v from "valibot";
import { parseDecimalInput } from "@/utils/formatters";

export const requirementSchema = v.object({
  item_id: v.pipe(v.string(), v.nonEmpty("Item harus dipilih.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih harga terlebih dahulu.")),
  qty: v.pipe(
    v.union([v.string(), v.number()]),
    v.check((val) => parseDecimalInput(val) >= 0, "Volume tidak boleh negatif."),
  ),
  has_tax: v.boolean(),
});

export interface RequirementFormValues {
  item_id: string;
  qty: string | number;
  item_price_id: string;
  has_tax: boolean;
}

export function buildDefaultValues(initialData?: RequirementDetail): RequirementFormValues {
  return {
    item_id: initialData?.item_id ?? "",
    qty: initialData?.qty != null ? String(initialData.qty).replace(".", ",") : "",
    item_price_id: initialData?.item_price_id ?? "",
    has_tax: Boolean(initialData?.has_tax),
  };
}

export interface RequirementFormProps {
  initialData?: RequirementDetail;
  onSuccess: () => void;
}
