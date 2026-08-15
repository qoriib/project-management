import { useMemo } from "react";
import { Card, VStack, HStack, Heading, Divider, Text, Button } from "@astryxdesign/core";
import { Table, proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { resolveItems, getUniqueBomOptions, calcGrandTotal } from "./po.utils";
import { formatRupiah } from "@/utils/formatters";
import { ItemSelectorCell, PriceSelectorCell, VendorSelectorCell } from "./POItemCells";
import { BomInfoCell, QtyInputCell, RemoveItemCell } from "./POItemActions";
import type { ItemPrice, Vendor } from "@/db/repositories";
import type { DashboardBOMReportItem } from "@/db/services";
import type { usePOForm } from "./usePOForm";
import type { POFormItemValue, POItemRow } from "./po.schema";

interface POItemsCardProps {
  form: ReturnType<typeof usePOForm>["form"];
  items: POFormItemValue[];
  bomData: DashboardBOMReportItem[];
  itemPricesMap: Map<number, ItemPrice[]>;
  vendors: Vendor[];
}

/** Card displaying PO item table, Add Item button, and estimated grand total */
export function POItemsCard({
  form,
  items,
  bomData,
  itemPricesMap,
  vendors,
}: POItemsCardProps) {
  const bomOptions = getUniqueBomOptions(bomData);
  const selectedItemIds = new Set(items.map((it) => it.item_id).filter((id) => id > 0));
  const resolvedItems = resolveItems(items, bomData, itemPricesMap);
  const grandTotal = calcGrandTotal(resolvedItems);

  const columns: TableColumn<POItemRow>[] = useMemo(() => [
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
          />
        );
      },
    },
    {
      key: "bom",
      header: "Rencana / Realisasi",
      width: pixel(180),
      renderCell: (row) => <BomInfoCell row={row} />,
    },
    {
      key: "price",
      header: "Variasi Harga",
      width: pixel(180),
      renderCell: (row) => {
        const idx = resolvedItems.indexOf(row);
        const prices = row.item_id ? (itemPricesMap.get(row.item_id) ?? []) : [];
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
          <QtyInputCell form={form} idx={idx} initialBalance={row.initial_balance} />
        );
      },
    },
    {
      key: "subtotal_item",
      header: "Subtotal",
      width: pixel(180),
      renderCell: (row) => (row.item_id ? formatRupiah(row.qty * row.price) : "-"),
    },
    {
      key: "remove",
      header: "",
      align: "end",
      width: pixel(50),
      renderCell: (row) => {
        const idx = resolvedItems.indexOf(row);
        return <RemoveItemCell form={form} idx={idx} />;
      },
    },
  ], [form, resolvedItems, bomOptions, selectedItemIds, itemPricesMap, vendors]);

  return (
    <Card padding={4}>
      <VStack gap={4}>
        <HStack justify="between" align="center">
          <Heading level={3}>Daftar Item</Heading>
          <form.Field name="items">
            {(field) => (
              <Button
                variant="secondary"
                label="Tambah Item"
                type="button"
                onClick={() =>
                  field.pushValue({
                    po_item_id: 0,
                    item_id: 0,
                    vendor_id: "",
                    item_price_id: "",
                    qty: 0,
                    original_qty: 0,
                  })
                }
              />
            )}
          </form.Field>
        </HStack>
        <Table columns={columns} data={resolvedItems} />
        <Divider />
        <HStack justify="end" align="center" gap={6}>
          <Text weight="semibold">Estimasi Total Biaya</Text>
          <Heading level={3}>{formatRupiah(grandTotal)}</Heading>
        </HStack>
      </VStack>
    </Card>
  );
}
