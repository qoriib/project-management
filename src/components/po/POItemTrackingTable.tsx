import { Badge, HStack, Table, Text, VStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { usePOStore } from "@/store/usePOStore";
import { type TableColumn, pixel, proportional, useTableRowIndex } from "@astryxdesign/core/Table";
import type { POItemDetail } from "@/db/repositories";

type TrackingRow = POItemDetail & Record<string, unknown>;

export function POItemTrackingTable() {
  const { currentItems: items, currentBOMData: bomData } = usePOStore();

  const itemColumns: TableColumn<TrackingRow>[] = [
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
      header: "Satuan",
      key: "unit",
      width: pixel(80),
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(240),
      renderCell: (row) => {
        const bomItem = bomData.find((b) => b.item_id === row.item_id && b.item_price_id === row.item_price_id);
        const bomPrice = bomItem?.price ?? 0;

        return (
          <VStack gap={0.5} align="end">
            <HStack gap={1} justify="end">
              <Text weight="medium">Realisasi:</Text>
              <Text type="code">{formatNumber(row.price)}</Text>
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
      header: "Volume",
      key: "qty",
      width: pixel(140),
      renderCell: (row) => {
        const bomItem = bomData.find((b) => b.item_id === row.item_id && b.item_price_id === row.item_price_id);
        const bomQty = bomItem?.planned_volume ?? 0;
        return (
          <VStack gap={0.5} align="end">
            <HStack gap={1} justify="end">
              <Text weight="medium">Realisasi:</Text>
              <Text type="code">{formatNumber(row.qty, 2)}</Text>
            </HStack>
            <HStack gap={1} justify="end">
              <Text size="sm" color="secondary">
                Rencana:
              </Text>
              <Text type="code" size="sm" color="secondary">
                {formatNumber(bomQty, 2)}
              </Text>
            </HStack>
          </VStack>
        );
      },
    },
    {
      align: "end",
      header: "Subtotal",
      key: "subtotal",
      width: pixel(240),
      renderCell: (row) => {
        const bomItem = bomData.find((b) => b.item_id === row.item_id && b.item_price_id === row.item_price_id);
        const bomPrice = bomItem?.price ?? 0;
        const totalBOM = (row.qty ?? 0) * bomPrice;
        const totalPO = (row.qty ?? 0) * (row.price ?? 0);

        return (
          <VStack gap={0.5} align="end">
            <HStack gap={1} justify="end">
              <Text weight="medium">Realisasi:</Text>
              <Text type="code">{formatNumber(totalPO)}</Text>
            </HStack>
            <HStack gap={1} justify="end">
              <Text size="sm" color="secondary">
                Rencana:
              </Text>
              <Text type="code" size="sm" color="secondary">
                {formatNumber(totalBOM)}
              </Text>
            </HStack>
          </VStack>
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
                {`${formatNumber(row.total_delivered ?? 0, 2)} / ${formatNumber(row.qty ?? 0, 2)}`}
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
    getRowKey: (item) => item.po_item_id,
    label: "No.",
  });

  return (
    <Table
      hasHover
      idKey="po_item_id"
      textOverflow="truncate"
      columns={itemColumns}
      data={items as TrackingRow[]}
      plugins={{ rowIndex: rowIndexPlugin }}
      emptyState={<TableEmptyState message="Tidak ada item dalam PO ini." />}
    />
  );
}
