import { Table, Text, VStack, HStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { usePOStore } from "@/store/usePOStore";
import type { POItemDetail } from "@/db/repositories";

export function POItemTrackingTable() {
  const { currentItems: items, currentBOMData: bomData } = usePOStore();

  const itemColumns: TableColumn<POItemDetail>[] = [
    {
      key: "item_name",
      header: "Item",
      width: proportional(1),
      renderCell: (row) => (
        <VStack gap={0.5}>
          <Text weight="medium">{row.item_name}</Text>
          <Text size="sm" color="secondary">BRG-{String(row.item_id).padStart(4, "0")}</Text>
        </VStack>
      )
    },
    {
      key: "price",
      header: "Harga",
      width: pixel(240),
      renderCell: (row) => {
        const bomItem = bomData.find(b => b.item_id === row.item_id);
        const bomPrice = bomItem?.price || 0;
        return (
          <VStack gap={0.5}>
            <Text weight="medium">Realisasi: {formatRupiah(row.price)}</Text>
            <Text size="sm" color="secondary">Rencana: {formatRupiah(bomPrice)}</Text>
          </VStack>
        );
      }
    },
    {
      key: "qty",
      header: "Volume",
      width: pixel(160),
      renderCell: (row) => {
        const bomItem = bomData.find((b) => b.item_id === row.item_id);
        const bomQty = bomItem?.planned_volume || 0;
        return (
          <VStack gap={0.5}>
            <Text weight="medium">Realisasi: {formatNumber(row.qty, 2)} {row.unit ?? ""}</Text>
            <Text size="sm" color="secondary">Rencana: {formatNumber(bomQty, 2)} {row.unit ?? ""}</Text>
          </VStack>
        );
      }
    },
    {
      key: "subtotal",
      header: "Total Harga",
      width: pixel(240),
      renderCell: (row) => {
        const bomItem = bomData.find(b => b.item_id === row.item_id);
        const bomPrice = bomItem?.price || 0;
        const totalBOM = (row.qty || 0) * bomPrice;
        const totalPO = (row.qty || 0) * (row.price || 0);

        return (
          <VStack gap={0.5}>
            <Text weight="medium">Realisasi: {formatRupiah(totalPO)}</Text>
            <Text size="sm" color="secondary">Rencana: {formatRupiah(totalBOM)}</Text>
          </VStack>
        );
      }
    },
    {
      key: "progress",
      header: "Perkembangan",
      width: pixel(180),
      renderCell: (row) => {
        const pct = row.qty > 0 ? ((row.total_terkirim || 0) / row.qty) * 100 : 0;
        const variant = pct > 100 ? "error" : pct >= 100 ? "success" : "accent";
        const isOver = pct > 100;

        return (
          <VStack gap={0.5}>
            <HStack justify="between">
              <Text size="sm" color="secondary" weight="medium">
                {`${formatNumber(row.total_terkirim || 0, 2)} / ${formatNumber(row.qty || 0, 2)} ${row.unit ?? ""}`}
              </Text>
              <Text
                size="sm"
                color={isOver ? undefined : "primary"}
                weight="bold"
                style={isOver ? { color: "var(--color-error, #d32f2f)" } : undefined}
              >
                {pct.toFixed(0)}%
              </Text>
            </HStack>
            <ProgressBar value={row.total_terkirim || 0} max={row.qty || 1} variant={variant} label="" />
          </VStack>
        );
      }
    },
  ];

  return (
    <Table
      idKey="po_item_id"
      textOverflow="truncate"
      columns={itemColumns}
      data={items}
      emptyState={<TableEmptyState message="Tidak ada item dalam PO ini." />}
    />
  );
}
