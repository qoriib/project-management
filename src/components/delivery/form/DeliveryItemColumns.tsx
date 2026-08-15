import { Text, VStack } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";
import { DeliveryQtyCell } from "./DeliveryQtyCell";
import { DeliverySisaCell } from "./DeliverySisaCell";

/**
 * Menghasilkan definisi kolom untuk tabel item delivery.
 * Setiap renderCell didelegasikan ke komponen atom yang sesuai.
 */
export function buildDeliveryItemColumns(
  form: ReturnType<typeof useDeliveryForm>["form"],
  items: DeliveryItemRow[]
): TableColumn<DeliveryItemRow>[] {
  return [
    {
      key: "item",
      header: "Barang / Material",
      width: proportional(2),
      renderCell: (row) => (
        <VStack gap={0.5}>
          <Text weight="medium">{row.item_name}</Text>
          {row.item_id ? (
            <Text size="sm" color="secondary">
              BRG-{String(row.item_id).padStart(4, "0")}
            </Text>
          ) : (
            <Text size="sm" color="secondary">
              Non-Master
            </Text>
          )}
        </VStack>
      ),
    },
    {
      key: "sisa",
      header: "Sisa PO",
      width: pixel(180),
      renderCell: (row) => {
        const idx = items.indexOf(row);
        return <DeliverySisaCell form={form} row={row} idx={idx} />;
      },
    },
    {
      key: "qty",
      header: "Diterima",
      width: pixel(180),
      renderCell: (row) => {
        const idx = items.indexOf(row);
        return <DeliveryQtyCell form={form} row={row} idx={idx} />;
      },
    },
    {
      key: "unit",
      header: "Satuan",
      width: pixel(100),
      renderCell: (row) => (
        <Text size="sm">{row.unit}</Text>
      ),
    },
  ];
}
