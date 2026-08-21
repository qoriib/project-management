import { Badge, HStack, Table, Text, VStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { useOrderStore } from "@/store/useOrderStore";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { OrderItemDetail } from "@/db/repositories";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";

type TrackingRow = OrderItemDetail & Record<string, unknown>;

export function OrderItemTrackingTable() {
  const { currentItems: items } = useOrderStore();

  const itemColumns: TableColumn<TrackingRow>[] = [
    {
      header: "Item",
      key: "item",
      width: proportional(2),
      renderCell: (row) => {
        const code = formatItemCode(row);
        return (
          <VStack gap={0.5} align="start">
            <Text weight="medium">{row.item_name || "-"}</Text>
            {code ? <EntityCode id={code} /> : "-"}
          </VStack>
        );
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => row.unit || "-",
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(180),
      renderCell: (row) => <Text type="code">{formatNumber(row.price)}</Text>,
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(140),
      renderCell: (row) => (
        <Text type="code" weight="medium">
          {formatNumber(row.qty)}
        </Text>
      ),
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (row) => <Text type="code">{formatNumber((row.qty ?? 0) * (row.price ?? 0))}</Text>,
    },
    {
      align: "end",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(140),
      renderCell: (row) => {
        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        const taxAmount = row.has_tax === 1 ? subtotal * 0.12 : 0;
        return row.has_tax === 1 ? (
          <Text type="code">{formatNumber(taxAmount)}</Text>
        ) : (
          <Text size="sm" color="secondary">
            -
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total",
      width: pixel(180),
      renderCell: (row) => {
        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        const total = row.has_tax === 1 ? subtotal * 1.12 : subtotal;
        return (
          <Text type="code" weight="medium">
            {formatNumber(total)}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Penerimaan",
      key: "progress",
      width: proportional(1),
      renderCell: (row) => {
        const pct = row.qty > 0 ? ((row.total_delivered ?? 0) / row.qty) * 100 : 0;
        const variant = pct > 100 ? "error" : pct >= 100 ? "success" : "accent";
        const isOver = pct > 100;
        const isComplete = Math.round(pct) === 100 && !isOver;

        return (
          <VStack gap={0.5}>
            <HStack justify="between">
              <Text type="code" color="secondary" weight="medium">
                {`${formatNumber(row.total_delivered ?? 0)} / ${formatNumber(row.qty ?? 0)}`}
              </Text>
              <Badge variant={isOver ? "red" : isComplete ? "green" : undefined} label={`${pct.toFixed(0)}%`} />
            </HStack>
            <ProgressBar value={row.total_delivered ?? 0} max={row.qty ?? 1} variant={variant} label="" />
          </VStack>
        );
      },
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: items as TrackingRow[],
    getRowKey: (item) => item.order_item_id,
    label: "#",
  });

  return (
    <Table
      hasHover
      idKey="order_item_id"
      textOverflow="truncate"
      columns={itemColumns}
      data={items as TrackingRow[]}
      plugins={{ rowIndex: rowIndexPlugin }}
      emptyState={<TableEmptyState message="Tidak ada item dalam Order ini." />}
    />
  );
}
