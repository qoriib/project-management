import { Card, HStack, Text, VStack } from "@astryxdesign/core";
import {
  Table,
  type TableColumn,
  pixel,
  proportional,
} from "@astryxdesign/core/Table";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";
import { DeliveryQtyCell } from "./DeliveryQtyCell";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode, formatNumber } from "@/utils/formatters";
import { usePOStore } from "@/store/usePOStore";
import { useMemo } from "react";

export interface DeliveryItemsCardInnerProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
  items: DeliveryItemRow[];
}

export function DeliveryItemsCardInner({
  form,
  items,
}: DeliveryItemsCardInnerProps) {
  const bomData = usePOStore((s) => s.currentBOMData);

  const columns: TableColumn<DeliveryItemRow>[] = useMemo(
    () => [
      {
        header: "Item",
        key: "item",
        renderCell: (row) => {
          const code = formatItemCode(row);
          return (
            <VStack gap={0.5} align="start">
              <Text weight="medium">{row.item_name}</Text>
              <EntityCode id={code} />
            </VStack>
          );
        },
        width: proportional(2),
      },
      {
        align: "end",
        header: "Harga (Rp)",
        key: "price_info",
        width: pixel(240),
        renderCell: (row) => {
          const bomItem = bomData.find(
            (b) =>
              b.item_id === row.item_id &&
              b.item_price_id === row.item_price_id,
          );
          const bomPrice = bomItem?.price ?? 0;

          return (
            <VStack gap={0.5} align="end">
              <HStack gap={1} justify="end">
                <Text weight="medium">Realisasi:</Text>
                <Text type="code">{formatNumber(row.price ?? 0)}</Text>
              </HStack>
              <HStack gap={1} justify="end">
                <Text size="sm" color="secondary">
                  Rencana:
                </Text>
                <Text type="code" size="sm" color="secondary">
                  {formatNumber(bomPrice)}
                </Text>
              </HStack>
            </VStack>
          );
        },
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
