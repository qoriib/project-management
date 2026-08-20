import { Card, Text, VStack } from "@astryxdesign/core";
import { Table, type TableColumn, pixel, proportional, useTableRowIndex } from "@astryxdesign/core/Table";
import type { ReceiptItemRow } from "./receipt.schema";
import type { useReceiptForm } from "./useReceiptForm";
import { ReceiptQtyCell } from "./ReceiptQtyCell";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode, formatNumber } from "@/utils/formatters";
import { useMemo } from "react";

export interface ReceiptItemsCardInnerProps {
  form: ReturnType<typeof useReceiptForm>["form"];
  items: ReceiptItemRow[];
}

export function ReceiptItemsCardInner({ form, items }: ReceiptItemsCardInnerProps) {
  const columns: TableColumn<ReceiptItemRow>[] = useMemo(
    () => [
      {
        header: "Item",
        key: "item",
        width: proportional(2),
        renderCell: (row) => {
          const code = formatItemCode(row);
          return (
            <VStack gap={0.5} align="start">
              <Text weight="medium">{row.item_name}</Text>
              <EntityCode id={code} />
            </VStack>
          );
        },
      },
      {
        align: "end",
        header: "Harga (Rp)",
        key: "price",
        width: pixel(180),
        renderCell: (row) => <Text type="code">{formatNumber(row.price ?? 0)}</Text>,
      },
      {
        align: "end",
        header: "Volume Diterima",
        key: "qty",
        width: pixel(180),
        renderCell: (row) => {
          const idx = items.indexOf(row);
          return <ReceiptQtyCell form={form} row={row} idx={idx} />;
        },
      },
      {
        header: "Satuan",
        key: "unit",
        width: pixel(100),
      },
    ],
    [form, items],
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
