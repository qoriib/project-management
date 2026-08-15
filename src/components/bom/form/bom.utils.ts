import { useMasterStore } from "@/store/useMasterStore";
import { useBOMStore } from "@/store/useBOMStore";
import { formatRupiah } from "@/utils/formatters";
import type { BOMDetail, ItemWithDetails } from "@/db/repositories";

// ── Price Options ──────────────────────────────────────────────────────────────

/**
 * Memuat harga untuk item yang dipilih, kemudian menyaring harga yang sudah
 * digunakan di BOM lain pada stage yang sama (kecuali BOM yang sedang diedit).
 *
 * @returns Array option { value, label } siap pakai untuk Selector
 */
export async function loadAvailablePriceOptions(
  itemId: string,
  initialData?: BOMDetail
): Promise<{ value: string; label: string }[]> {
  const { itemPricesMap, loadItemPrices } = useMasterStore.getState();
  const { boms: existingBoms } = useBOMStore.getState();

  let prices = itemPricesMap.get(Number(itemId));
  if (!prices) {
    prices = await loadItemPrices(Number(itemId));
  }

  const usedPriceIds = existingBoms
    .filter(
      (b) =>
        b.item_id === Number(itemId) &&
        (!initialData || b.bom_id !== initialData.bom_id)
    )
    .map((b) => b.item_price_id);

  return prices
    .filter((p) => !usedPriceIds.includes(p.item_price_id))
    .map((p) => ({
      value: String(p.item_price_id),
      label: formatRupiah(p.price),
    }));
}

// ── Item Options ───────────────────────────────────────────────────────────────

/**
 * Memfilter daftar item agar tidak menampilkan item yang sudah ada di BOM lain,
 * kecuali item milik BOM yang sedang diedit.
 */
export function buildItemOptions(
  items: ItemWithDetails[],
  existingBoms: BOMDetail[],
  initialData?: BOMDetail
): { value: string; label: string }[] {
  return [
    { value: "", label: "Pilih Material/Alat..." },
    ...items
      .filter(
        (i) =>
          initialData?.item_id === i.item_id ||
          !existingBoms.some((b) => b.item_id === i.item_id)
      )
      .map((i) => ({
        value: String(i.item_id),
        label: `${i.item_name} (${i.unit_name})`,
      })),
  ];
}
