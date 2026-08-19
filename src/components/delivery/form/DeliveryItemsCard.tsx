import { Card, Text, VStack } from "@astryxdesign/core";
import { Table, type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";
import { DeliveryQtyCell } from "./DeliveryQtyCell";
import { DeliveryRemainingCell } from "./DeliveryRemainingCell";
import { EntityCode } from "@/components/shared/EntityCode";
import { useMemo } from "react";

interface DeliveryItemsCardProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
}

function DeliveryItemsCardInner({
  form,
  items,
}: DeliveryItemsCardProps & { items: DeliveryItemRow[] }) {
  const columns: TableColumn<DeliveryItemRow>[] = useMemo(
    () => [
      {
        header: "Item",
        key: "item",
        renderCell: (row) => (
          <VStack gap={0.5}>
            <Text weight="medium">{row.item_name}</Text>
            {row.item_id ? (
              <EntityCode prefix="BRG" id={row.item_id} />
            ) : (
              <Text size="sm" color="secondary">
                Non-Master
              </Text>
            )}
          </VStack>
        ),
        width: proportional(1),
      },
      {
        align: "end",
        header: "Dipesan / Diterima",
        key: "remaining",
        renderCell: (row) => <DeliveryRemainingCell row={row} />,
        width: pixel(180),
      },
      {
        align: "end",
        header: "Volume Diterima",
        key: "qty",
        renderCell: (row) => {
          const idx = items.indexOf(row);
          return <DeliveryQtyCell form={form} row={row} idx={idx} />;
        },
        width: pixel(180),
      },
      {
        header: "Satuan",
        key: "unit",
        renderCell: (row) => row.unit,
        width: pixel(100),
      },
    ],
    [form, items],
  );

  return (
    <Card padding={4}>
      <VStack gap={4}>
        <Table textOverflow="truncate" columns={columns} data={items} />
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
    <form.Subscribe selector={(state) => [state.values.po_id, state.values.items] as const}>
      {([poId, items]) => {
        if (!poId || items.length === 0) {
          return null;
        }
        return <DeliveryItemsCardInner form={form} items={items} />;
      }}
    </form.Subscribe>
  );
}
