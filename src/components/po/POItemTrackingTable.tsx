import { Table, Text, VStack, HStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import type { POItemDetail } from "@/db/repositories";
import { usePOStore } from "@/store/usePOStore";

export function POItemTrackingTable() {
  const { currentItems: items, currentBOMData: bomData } = usePOStore();
  const itemColumns: TableColumn<POItemDetail>[] = [
    {
      key: "item_name",
      header: "Item",
      width: proportional(1),
      renderCell: (row) => (
        <VStack gap={1}>
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
          <VStack gap={1}>
            <Text weight="medium">Realisasi: {formatRupiah(row.price)}</Text>
            <Text size="sm" color="secondary">Rencana: {formatRupiah(bomPrice)}</Text>
          </VStack>
        );
      }
    },
    {
      key: "qty",
      header: "Vol. Kontrak",
      width: pixel(120),
      renderCell: (row) => `${formatNumber(row.qty, 2)} ${row.unit ?? ""}`
    },
    {
      key: "delta",
      header: "Selisih",
      width: pixel(120),
      renderCell: (row) => `${formatNumber(row.sisa, 2)} ${row.unit ?? ""}`
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
          <VStack gap={1}>
            <Text weight="medium">Realisasi: {formatRupiah(totalPO)}</Text>
            <Text size="sm" color="secondary">Rencana: {formatRupiah(totalBOM)}</Text>
          </VStack>
        );
      }
    },
    {
      key: "progress",
      header: "Realisasi",
      width: pixel(180),
      renderCell: (row) => {
        const pct = row.qty > 0 ? ((row.total_terkirim || 0) / row.qty) * 100 : 0;
        return (
          <VStack gap={1} style={{ width: '100%' }}>
            <HStack justify="between">
              <Text size="sm" color="secondary" weight="medium">{`${formatNumber(row.total_terkirim || 0, 2)} ${row.unit ?? ""}`}</Text>
              <Text size="sm" color="primary" weight="bold">{pct.toFixed(0)}%</Text>
            </HStack>
            <ProgressBar value={row.total_terkirim || 0} max={row.qty || 1} variant={pct >= 100 ? "success" : "accent"} label="" />
          </VStack>
        );
      }
    },
  ];

  return (
    <Table
      verticalAlign="top"
      textOverflow="truncate"
      columns={itemColumns}
      data={items}
      idKey="po_item_id"
      emptyState={<TableEmptyState message="Tidak ada item dalam PO ini." />}
    />
  );
}
