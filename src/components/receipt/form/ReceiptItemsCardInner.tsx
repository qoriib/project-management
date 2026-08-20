import { Card, HStack, Text, VStack } from "@astryxdesign/core";
import { Table, type TableColumn, pixel, proportional, useTableRowIndex } from "@astryxdesign/core/Table";
import type { ReceiptItemRow } from "./receipt.schema";
import type { useReceiptForm } from "./useReceiptForm";
import { ReceiptQtyCell } from "./ReceiptQtyCell";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode, formatNumber } from "@/utils/formatters";
import { useOrderStore } from "@/store/useOrderStore";
import { useMemo } from "react";

export interface ReceiptItemsCardInnerProps {
  form: ReturnType<typeof useReceiptForm>["form"];
  items: ReceiptItemRow[];
}

export function ReceiptItemsCardInner({ form, items }: ReceiptItemsCardInnerProps) {
  const bomData = useOrderStore((s) => s.currentRequirementData);

  const columns: TableColumn<ReceiptItemRow>[] = useMemo(
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
          const bomItem = bomData.find((b) => b.item_id === row.item_id && b.item_price_id === row.item_price_id);
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
          return <ReceiptQtyCell form={form} row={row} idx={idx} />;
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

  const rowIndexPlugin = useTableRowIndex({
    data: items,
    getRowKey: (item) => item.order_item_id,
    label: "#",
  });

  return (
    <Card padding={4}>
      <VStack gap={4}>
        <Table
          textOverflow="truncate"
          columns={columns}
          data={items}
          idKey="order_item_id"
          plugins={{ rowIndex: rowIndexPlugin }}
        />
      </VStack>
    </Card>
  );
}
