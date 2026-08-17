import type { ItemPrice, POItemInput, BOMDetail } from "@/db/repositories";
import type { POFormItemValue, POItemRow } from "./po.schema";

/**
 * Deduplicate BOM data to unique items (one entry per item_id).
 * Used for the Item selector dropdown.
 */
export function getUniqueBomOptions(
  bomData: BOMDetail[]
): BOMDetail[] {
  const uniqueMap = new Map(bomData.map((b) => [b.item_id, b]));
  return Array.from(uniqueMap.values());
}

function calcPlannedAndOrdered(
  it: POFormItemValue,
  bomData: BOMDetail[]
): { plannedVolume: number; totalOrdered: number } {
  const hasPriceSelected = it.item_price_id.length > 0;

  const matchingVariants = bomData.filter(
    (bom) =>
      bom.item_id === it.item_id &&
      (!hasPriceSelected || bom.item_price_id === it.item_price_id)
  );

  let plannedVolume = 0;
  let totalOrdered = 0;

  for (const bom of matchingVariants) {
    plannedVolume += bom.qty;
    // Note: totalOrdered is not available in BOMDetail, so it's 0. 
    // If needed, it must be fetched separately.
  }

  return { plannedVolume, totalOrdered };
}

/**
 * Resolves raw form item values into full POItemRow objects
 * by joining with BOM data and item prices map.
 */
export function resolveItems(
  items: POFormItemValue[],
  bomData: BOMDetail[],
  itemPricesMap: Map<string, ItemPrice[]>
): POItemRow[] {
  const bomOptions = getUniqueBomOptions(bomData);

  return items.map((it, idx) => {
    const matchedBom = bomOptions.find((bom) => bom.item_id === it.item_id);
    const prices = itemPricesMap.get(it.item_id) ?? [];

    const selectedPrice = prices.find(
      (p) => p.item_price_id === it.item_price_id
    );

    const { plannedVolume, totalOrdered } = calcPlannedAndOrdered(it, bomData);

    const originalQty = it.original_qty ?? 0;
    const initialBalance = plannedVolume - totalOrdered + originalQty;

    return {
      ...it,
      po_item_id: it.po_item_id ?? `new-${idx}`,
      id: it.po_item_id ? it.po_item_id : `new-${idx}`,
      item_name: matchedBom?.item_name ?? "",
      unit: matchedBom?.unit ?? "",
      price: selectedPrice?.price ?? 0,
      planned_volume: plannedVolume,
      total_ordered: totalOrdered,
      original_qty: originalQty,
      initial_balance: initialBalance,
    };
  });
}

/** Calculates grand total of all resolved items */
export function calcGrandTotal(items: POItemRow[]): number {
  return items.reduce((sum, it) => sum + it.qty * it.price, 0);
}

/** Converts form item values into POItemInput payload for repository */
export function buildPOItemPayload(items: POFormItemValue[]): POItemInput[] {
  return items.map((it) => ({
    po_item_id: it.po_item_id || undefined,
    item_id: it.item_id,
    vendor_id: it.vendor_id,
    item_price_id: it.item_price_id,
    qty: it.qty,
  }));
}
