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
  const byItemId = bomData.map((b) => [b.item_id, b] as const);
  const uniqueMap = new Map(byItemId);
  return Array.from(uniqueMap.values());
}

// ── Volume calculators ─────────────────────────────────────────────────────────

function calcPlannedAndOrdered(
  it: POFormItemValue,
  bomData: DashboardBOMReportItem[]
): { planned_volume: number; total_ordered: number } {
  const hasPriceSelected = it.item_price_id.length > 0;

  if (hasPriceSelected) {
    const matchingVariants = bomData.filter(
      (bom) =>
        bom.item_id === it.item_id &&
        String(bom.item_price_id) === it.item_price_id
    );

    const planned_volume = matchingVariants.reduce(
      (sum, bom) => sum + bom.planned_volume,
      0
    );
    const total_ordered = matchingVariants.reduce(
      (sum, bom) => sum + bom.total_ordered,
      0
    );

    return { planned_volume, total_ordered };
  }

  const allVariants = bomData.filter((bom) => bom.item_id === it.item_id);

  const planned_volume = allVariants.reduce(
    (sum, bom) => sum + bom.planned_volume,
    0
  );
  const total_ordered = allVariants.reduce(
    (sum, bom) => sum + bom.total_ordered,
    0
  );

  return { planned_volume, total_ordered };
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
    const matchedBom = bomOptions.find((bom) => bom.item_id === it.item_id);
    const prices = priceCache.get(it.item_id) ?? [];

    const selectedPrice = prices.find(
      (p) => String(p.item_price_id) === it.item_price_id
    );

    const { planned_volume, total_ordered } = calcPlannedAndOrdered(it, bomData);

    const original_qty = it.original_qty ?? 0;
    const sisaAwal = planned_volume - total_ordered + original_qty;

    const item_name = matchedBom?.item_name ?? "";
    const unit = matchedBom?.unit ?? "";
    const price = selectedPrice?.price ?? 0;

    return {
      ...it,
      item_name,
      unit,
      price,
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
export function buildPOItemPayload(items: POFormItemValue[]): POItemInput[] {
  return items.map((it) => {
    const po_item_id = it.po_item_id || undefined;
    const vendor_id = Number(it.vendor_id);
    const item_price_id = Number(it.item_price_id);

    return {
      po_item_id,
      item_id: it.item_id,
      vendor_id,
      item_price_id,
      qty: it.qty,
    };
  });
}
