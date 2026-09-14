import type { RequirementDetail } from "@/db/repositories";
import * as v from "valibot";
import { parseDecimalInput } from "@/utils/formatters";

export const requirementSchema = v.object({
  requirement_group_id: v.pipe(
    v.string("Kelompok pekerjaan wajib dipilih."),
    v.nonEmpty("Kelompok pekerjaan wajib dipilih."),
  ),
  item_id: v.pipe(v.string(), v.nonEmpty("Item harus dipilih.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih harga terlebih dahulu.")),
  qty: v.pipe(
    v.union([v.string(), v.number()]),
    v.check((val) => parseDecimalInput(val) >= 0, "Volume tidak boleh negatif."),
  ),
  has_tax: v.boolean(),
});

export interface RequirementFormValues {
  requirement_group_id: string;
  item_id: string;
  qty: string | number;
  item_price_id: string;
  has_tax: boolean;
}

export function buildDefaultValues(initialData?: RequirementDetail, initialGroupId?: string): RequirementFormValues {
  return {
    requirement_group_id: initialData?.requirement_group_id ?? initialGroupId ?? "",
    item_id: initialData?.item_id ?? "",
    qty: initialData?.qty != null ? String(initialData.qty).replace(".", ",") : "",
    item_price_id: initialData?.item_price_id ?? "",
    has_tax: Boolean(initialData?.has_tax),
  };
}

export interface RequirementFormProps {
  initialData?: RequirementDetail;
  initialGroupId?: string;
  onSuccess: () => void;
}
