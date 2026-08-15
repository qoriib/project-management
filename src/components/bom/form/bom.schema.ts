import * as v from "valibot";
import type { BOMDetail } from "@/db/repositories";

// ── Valibot Schema ─────────────────────────────────────────────────────────────

export const bomSchema = v.object({
  item_id: v.pipe(v.string(), v.nonEmpty("Material harus dipilih.")),
  qty: v.pipe(v.number(), v.minValue(0.001, "Volume harus lebih dari 0.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih harga terlebih dahulu.")),
});

// ── Types ──────────────────────────────────────────────────────────────────────

export type BOMFormValues = {
  item_id: string;
  qty: number;
  item_price_id: string;
};

/** Buat default values form dari data awal (mode edit) atau kosong (mode tambah) */
export function buildDefaultValues(initialData?: BOMDetail): BOMFormValues {
  return {
    item_id: initialData?.item_id ? String(initialData.item_id) : "",
    qty: initialData?.qty ? Number(initialData.qty) : 0,
    item_price_id: initialData?.item_price_id
      ? String(initialData.item_price_id)
      : "",
  };
}

export interface BOMFormProps {
  stageId?: number;
  initialData?: BOMDetail;
  isDisabled?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}
