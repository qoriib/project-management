import type { ItemPrice, POItemInput } from "@/db/repositories";
import type { DashboardBOMReportItem } from "@/db/services";
import type { POFormItemValue, POItemRow } from "./po.schema";

// ── BOM Helpers ────────────────────────────────────────────────────────────────

/**
 * Deduplicate BOM data to unique items (one entry per item_id).
 * Used for the Item selector dropdown.
 */
export function getUniqueBomOptions(
  bomData: DashboardBOMReportItem[]
): DashboardBOMReportItem[] {
  return Array.from(new Map(bomData.map((b) => [b.item_id, b])).values());
}

// ── Item Resolution ────────────────────────────────────────────────────────────

/**
 * Resolves raw form item values into full POItemRow objects
 * by joining with BOM data and price cache.
 */
export function resolveItems(
  items: POFormItemValue[],
  bomData: DashboardBOMReportItem[],
  priceCache: Map<number, ItemPrice[]>
): POItemRow[] {
  const bomOptions = getUniqueBomOptions(bomData);

  return items.map((it) => {
    const b = bomOptions.find((bom) => bom.item_id === it.item_id);
    const prices = priceCache.get(it.item_id) ?? [];
    const selectedPrice = prices.find(
      (p) => String(p.item_price_id) === it.item_price_id
    );

    let planned_volume = 0;
    let total_ordered = 0;

    if (it.item_price_id) {
      const matchingVariants = bomData.filter(
        (bom) =>
          bom.item_id === it.item_id &&
          String(bom.item_price_id) === it.item_price_id
      );
      planned_volume = matchingVariants.reduce(
        (sum, v) => sum + v.planned_volume,
        0
      );
      total_ordered = matchingVariants.reduce(
        (sum, v) => sum + v.total_ordered,
        0
      );
    } else {
      const allVariants = bomData.filter((bom) => bom.item_id === it.item_id);
      planned_volume = allVariants.reduce((sum, v) => sum + v.planned_volume, 0);
      total_ordered = allVariants.reduce((sum, v) => sum + v.total_ordered, 0);
    }

    const original_qty = it.original_qty ?? 0;
    const sisaAwal = planned_volume - total_ordered + original_qty;

    return {
      ...it,
      item_name: b?.item_name ?? "",
      unit: b?.unit ?? "",
      price: selectedPrice?.price ?? 0,
      planned_volume,
      total_ordered,
      original_qty,
      sisaAwal,
    };
  });
}

// ── Calculation ────────────────────────────────────────────────────────────────

/** Hitung grand total dari semua item yang sudah di-resolve */
export function calcGrandTotal(items: POItemRow[]): number {
  return items.reduce((sum, it) => sum + it.qty * it.price, 0);
}

// ── Payload Builder ────────────────────────────────────────────────────────────

/** Konversi form item values menjadi POItemInput untuk dikirim ke repository */
export function buildPOItemPayload(
  items: POFormItemValue[]
): POItemInput[] {
  return items.map((it) => ({
    po_item_id: it.po_item_id || undefined,
    item_id: it.item_id,
    vendor_id: Number(it.vendor_id),
    item_price_id: Number(it.item_price_id),
    qty: it.qty,
  }));
}
