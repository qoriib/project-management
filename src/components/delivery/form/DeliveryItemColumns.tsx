import { Text } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";
import { DeliveryQtyCell } from "./DeliveryQtyCell";

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
        <Text weight="medium">{row.item_name}</Text>
      ),
    },
    {
      key: "sisa",
      header: "Sisa PO",
      width: pixel(200),
      renderCell: (row) => {
        const idx = items.indexOf(row);
        return (
          <DeliveryQtyCell form={form} row={row} idx={idx} />
        );
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
