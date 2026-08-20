import { Card, Text, VStack } from "@astryxdesign/core";
import { Table, type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";
import { DeliveryQtyCell } from "./DeliveryQtyCell";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode, formatNumber } from "@/utils/formatters";
import { usePOStore } from "@/store/usePOStore";
import { useMemo } from "react";

interface DeliveryItemsCardProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
}

function DeliveryItemsCardInner({
  form,
  items,
}: DeliveryItemsCardProps & { items: DeliveryItemRow[] }) {
  const bomData = usePOStore((s) => s.currentBOMData);

  const columns: TableColumn<DeliveryItemRow>[] = useMemo(
    () => [
      {
        header: "Item",
        key: "item",
        renderCell: (row) => (
          <VStack gap={0.5}>
            <Text weight="medium">{row.item_name}</Text>
            {row.item_id ? (
              <Text type="code" size="sm" color="secondary">
                {formatItemCode(row.category_prefix, row.category_code, row.item_code)}
              </Text>
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
        header: "Harga Rencana",
        key: "planned_price",
        width: pixel(140),
        renderCell: (row) => {
          const bomItem = bomData.find(
            (b) => b.item_id === row.item_id && b.item_price_id === row.item_price_id,
          );
          return <Text type="code">{formatNumber(bomItem?.price ?? 0)}</Text>;
        },
      },
      {
        align: "end",
        header: "Harga Realisasi",
        key: "realized_price",
        width: pixel(140),
        renderCell: (row) => <Text type="code">{formatNumber(row.price ?? 0)}</Text>,
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
    [form, items, bomData],
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
