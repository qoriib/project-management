import { Text } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import type { ItemPrice, Vendor } from "@/db/repositories";
import type { DashboardBOMReportItem } from "@/db/services";
import { formatRupiah } from "@/utils/formatters";
import type { usePOForm } from "./usePOForm";
import type { POItemRow } from "./po.schema";
import {
  ItemSelectorCell,
  PriceSelectorCell,
  VendorSelectorCell,
} from "./POItemCells";
import { BomInfoCell, QtyInputCell, RemoveItemCell } from "./POItemActions";

interface BuildColumnsOptions {
  form: ReturnType<typeof usePOForm>["form"];
  resolvedItems: POItemRow[];
  priceCache: Map<number, ItemPrice[]>;
  selectedItemIds: Set<number>;
  bomOptions: DashboardBOMReportItem[];
  vendors: Vendor[];
  getPricesForItem: (itemId: number) => Promise<ItemPrice[]>;
}

// ── buildPOItemColumns ─────────────────────────────────────────────────────────

/**
 * Factory function yang menghasilkan definisi kolom untuk tabel item PO.
 * Setiap renderCell didelegasikan ke komponen atom di POItemCells.tsx.
 */
export function buildPOItemColumns({
  form,
  resolvedItems,
  priceCache,
  selectedItemIds,
  bomOptions,
  vendors,
  getPricesForItem,
}: BuildColumnsOptions): TableColumn<POItemRow>[] {
  return [
    {
      key: "item",
      header: "Item",
      width: proportional(1),
      renderCell: (row) => {
        const idx = resolvedItems.indexOf(row);
        return (
          <ItemSelectorCell
            form={form}
            idx={idx}
            bomOptions={bomOptions}
            selectedItemIds={selectedItemIds}
            getPricesForItem={getPricesForItem}
          />
        );
      },
    },
    {
      key: "bom",
      header: "BOM (Sisa / Rencana)",
      width: pixel(180),
      renderCell: (row) => <BomInfoCell row={row} />,
    },
    {
      key: "price",
      header: "Variasi Harga",
      width: pixel(180),
      renderCell: (row) => {
        const idx = resolvedItems.indexOf(row);
        const prices = row.item_id ? (priceCache.get(row.item_id) ?? []) : [];
        return (
          <PriceSelectorCell
            form={form}
            idx={idx}
            itemId={row.item_id}
            prices={prices}
          />
        );
      },
    },
    {
      key: "vendor",
      header: "Vendor Pemasok",
      width: pixel(280),
      renderCell: (row) => {
        const idx = resolvedItems.indexOf(row);
        return <VendorSelectorCell form={form} idx={idx} vendors={vendors} />;
      },
    },
    {
      key: "qty",
      header: "Volume Dipesan",
      width: pixel(160),
      renderCell: (row) => {
        const idx = resolvedItems.indexOf(row);
        return (
          <QtyInputCell form={form} idx={idx} sisaAwal={row.sisaAwal} />
        );
      },
    },
    {
      key: "subtotal_item",
      header: "Subtotal",
      width: pixel(180),
      renderCell: (row) =>
        row.item_id ? (
          <Text size="sm">{formatRupiah(row.qty * row.price)}</Text>
        ) : null,
    },
    {
      key: "remove",
      header: "",
      width: pixel(80),
      renderCell: (row) => {
        const idx = resolvedItems.indexOf(row);
        return <RemoveItemCell form={form} idx={idx} />;
      },
    },
  ];
}
