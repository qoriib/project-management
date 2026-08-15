import { useMasterStore } from "@/store/useMasterStore";
import { useBOMStore } from "@/store/useBOMStore";
import { formatRupiah } from "@/utils/formatters";
import type { BOMDetail, ItemWithDetails } from "@/db/repositories";

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

  const itemIdNum = Number(itemId);

  let prices = itemPricesMap.get(itemIdNum);

  if (!prices) {
    prices = await loadItemPrices(itemIdNum);
  }

  const isEditingThisBom = (bomId: number) =>
    initialData !== undefined && bomId === initialData.bom_id;

  const usedPriceIds = existingBoms
    .filter((b) => b.item_id === itemIdNum && !isEditingThisBom(b.bom_id))
    .map((b) => b.item_price_id);

  const availablePrices = prices.filter(
    (p) => !usedPriceIds.includes(p.item_price_id)
  );

  const options = availablePrices.map((p) => ({
    value: String(p.item_price_id),
    label: formatRupiah(p.price),
  }));

  return options;
}

/**
 * Memfilter daftar item agar tidak menampilkan item yang sudah ada di BOM lain,
 * kecuali item milik BOM yang sedang diedit.
 */
export function buildItemOptions(
  items: ItemWithDetails[],
  existingBoms: BOMDetail[],
  initialData?: BOMDetail
): { value: string; label: string }[] {
  const isCurrentItem = (itemId: number) =>
    initialData?.item_id === itemId;

  const isAlreadyUsed = (itemId: number) =>
    existingBoms.some((b) => b.item_id === itemId);

  const filteredItems = items.filter(
    (i) => isCurrentItem(i.item_id) || !isAlreadyUsed(i.item_id)
  );

  const mappedItems = filteredItems.map((i) => ({
    value: String(i.item_id),
    label: `${i.item_name} (${i.unit_name})`,
  }));

  return mappedItems;
}
