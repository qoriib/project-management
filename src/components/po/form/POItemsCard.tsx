import { Card, VStack, HStack, Heading, Divider, Text, Button } from "@astryxdesign/core";
import { Table } from "@astryxdesign/core/Table";
import type { ItemPrice, Vendor } from "@/db/repositories";
import type { DashboardBOMReportItem } from "@/db/services";
import { formatRupiah } from "@/utils/formatters";
import { resolveItems, getUniqueBomOptions, calcGrandTotal } from "./po.utils";
import { buildPOItemColumns } from "./POItemColumns";
import type { usePOForm } from "./usePOForm";
import type { POFormItemValue } from "./po.schema";

interface POItemsCardProps {
  form: ReturnType<typeof usePOForm>["form"];
  items: POFormItemValue[];
  bomData: DashboardBOMReportItem[];
  priceCache: Map<number, ItemPrice[]>;
  vendors: Vendor[];
  getPricesForItem: (itemId: number) => Promise<ItemPrice[]>;
}

// ── POItemsCard ───────────────────────────────────────────────────────────────

/**
 * Card yang menampilkan tabel daftar item PO, tombol "Tambah Item",
 * dan ringkasan total biaya.
 */
export function POItemsCard({
  form,
  items,
  bomData,
  priceCache,
  vendors,
  getPricesForItem,
}: POItemsCardProps) {
  const bomOptions = getUniqueBomOptions(bomData);
  const selectedItemIds = new Set(
    items.map((it) => it.item_id).filter((id) => id > 0)
  );
  const resolvedItems = resolveItems(items, bomData, priceCache);
  const grandTotal = calcGrandTotal(resolvedItems);

  const columns = buildPOItemColumns({
    form,
    resolvedItems,
    priceCache,
    selectedItemIds,
    bomOptions,
    vendors,
    getPricesForItem,
  });

  return (
    <Card padding={4}>
      <VStack gap={4}>
        {/* Header */}
        <HStack justify="between" align="center">
          <Heading level={3}>Daftar Item PO</Heading>
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

        {/* Tabel */}
        <Table verticalAlign="top" columns={columns} data={resolvedItems} />

        <Divider />

        {/* Grand Total */}
        <HStack justify="end" align="center" gap={6}>
          <Text weight="semibold">Estimasi Total Biaya</Text>
          <Heading level={2}>{formatRupiah(grandTotal)}</Heading>
        </HStack>
      </VStack>
    </Card>
  );
}
