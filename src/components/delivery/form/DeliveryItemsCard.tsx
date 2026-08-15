import { Card, VStack, Text } from "@astryxdesign/core";
import { Table, proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";
import { DeliveryQtyCell } from "./DeliveryQtyCell";
import { DeliveryRemainingCell } from "./DeliveryRemainingCell";
import { useMemo } from "react";

interface DeliveryItemsCardProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
}

function DeliveryItemsCardInner({
  form,
  items,
}: DeliveryItemsCardProps & { items: DeliveryItemRow[] }) {
  const columns: TableColumn<DeliveryItemRow>[] = useMemo(() => [
    {
      key: "item",
      header: "Item",
      width: proportional(1),
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
      header: "Dipesan / Diterima",
      width: pixel(180),
      renderCell: (row) => <DeliveryRemainingCell row={row} />,
    },
    {
      key: "qty",
      header: "Volume Diterima",
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
      renderCell: (row) => row.unit,
    },
  ], [form, items]);

  return (
    <Card padding={4}>
      <VStack gap={4}>
        <Table columns={columns} data={items} />
      </VStack>
    </Card>
  );
}

/**
 * Card yang menampilkan tabel item delivery dengan input volume.
 * Hanya muncul setelah PO dipilih dan memiliki item.
 */
export function DeliveryItemsCard({ form }: DeliveryItemsCardProps) {
  return (
    <form.Subscribe
      selector={(state) => [state.values.po_id, state.values.items] as const}
    >
      {([poId, items]) => {
        if (!poId || items.length === 0) return null;
        return <DeliveryItemsCardInner form={form} items={items} />;
      }}
    </form.Subscribe>
  );
}
