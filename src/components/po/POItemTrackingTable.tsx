import { HStack, Table, Text, VStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { formatNumber } from "@/utils/formatters";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { usePOStore } from "@/store/usePOStore";
import type { POItemDetail } from "@/db/repositories";

type TrackingRow = POItemDetail & Record<string, unknown>;

export function POItemTrackingTable() {
  const { currentItems: items, currentBOMData: bomData } = usePOStore(),
    itemColumns: TableColumn<TrackingRow>[] = [
      {
        header: "Kode Item",
        key: "item_code_full",
        renderCell: (row) => {
          const code =
            `${row.category_prefix || ""} ${row.category_code || ""} ${row.item_code || ""}`.trim();
          return code ? <EntityCode prefix="" id={code} /> : "-";
        },
        width: pixel(160),
      },

      {
        header: "Item",
        key: "item",
        renderCell: (row) => {
          return <Text weight="medium">{row.item_name}</Text>;
        },
        width: proportional(1),
      },
      {
        align: "end",
        header: "Harga (Rp)",
        key: "price",
        renderCell: (row) => {
          const bomItem = bomData.find(
            (b) => b.item_id === row.item_id && b.item_price_id === row.item_price_id,
          );
          const bomPrice = bomItem?.price || 0;
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
        width: pixel(240),
      },
      {
        header: "Satuan",
        key: "unit",
        renderCell: (row) => row.unit || "-",
        width: pixel(100),
      },
      {
        align: "end",
        header: "Volume",
        key: "qty",
        renderCell: (row) => {
          const bomItem = bomData.find(
            (b) => b.item_id === row.item_id && b.item_price_id === row.item_price_id,
          );
          const bomQty = bomItem?.planned_volume || 0;
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
        width: pixel(140),
      },
      {
        align: "end",
        header: "Total Harga",
        key: "subtotal",
        renderCell: (row) => {
          const bomItem = bomData.find(
            (b) => b.item_id === row.item_id && b.item_price_id === row.item_price_id,
          );
          const bomPrice = bomItem?.price || 0;
          const totalBOM = (row.qty || 0) * bomPrice;
          const totalPO = (row.qty || 0) * (row.price || 0);

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
        width: pixel(240),
      },
      {
        align: "end",
        header: "Pengiriman",
        key: "progress",
        renderCell: (row) => {
          const pct = row.qty > 0 ? ((row.total_delivered || 0) / row.qty) * 100 : 0;
          const variant = pct > 100 ? "error" : pct >= 100 ? "success" : "accent";
          const isOver = pct > 100;

          return (
            <VStack gap={0.5}>
              <HStack justify="between">
                <Text type="code" size="sm" color="secondary" weight="medium">
                  {`${formatNumber(row.total_delivered || 0, 2)} / ${formatNumber(row.qty || 0, 2)}`}
                </Text>
                <Text
                  type="code"
                  size="sm"
                  color={isOver ? undefined : "primary"}
                  weight="bold"
                  style={isOver ? { color: "var(--color-error, #d32f2f)" } : undefined}
                >
                  {pct.toFixed(0)}%
                </Text>
              </HStack>
              <ProgressBar
                value={row.total_delivered || 0}
                max={row.qty || 1}
                variant={variant}
                label=""
              />
            </VStack>
          );
        },
        width: pixel(180),
      },
    ];

  return (
    <Table
      hasHover
      idKey="po_item_id"
      textOverflow="truncate"
      columns={itemColumns}
      data={items as TrackingRow[]}
      emptyState={<TableEmptyState message="Tidak ada item dalam PO ini." />}
    />
  );
}
