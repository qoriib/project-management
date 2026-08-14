import { Table, Text, VStack, HStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import type { POItemDetail } from "@/db/repositories";
import type { DashboardBOMReportItem } from "@/db/services";

interface POItemTrackingTableProps {
  items: POItemDetail[];
  bomData?: DashboardBOMReportItem[];
}

export function POItemTrackingTable({ items, bomData = [] }: POItemTrackingTableProps) {
  const itemColumns: TableColumn<POItemDetail>[] = [
    {
      key: "item_name", header: "Barang / Material", width: proportional(1.5), renderCell: (row) => (
        <VStack gap={1}>
          <Text weight="medium">{row.item_name}</Text>
          <Text size="sm" color="secondary">Kode: BRG-{String(row.item_id).padStart(4, "0")}</Text>
        </VStack>
      )
    },
    {
      key: "price", header: "Harga (BOM vs PO)", width: pixel(200), renderCell: (row) => {
        const bomItem = bomData.find(b => b.item_id === row.item_id);
        const bomPrice = bomItem?.price || 0;
        const diff = row.price - bomPrice;
        return (
          <VStack gap={1}>
            <Text size="sm" color="secondary">BOM: {formatRupiah(bomPrice)}</Text>
            <HStack gap={2}>
              <Text weight="medium">PO: {formatRupiah(row.price)}</Text>
              {diff > 0 && <Text size="sm" color="secondary">(+{formatRupiah(diff)})</Text>}
              {diff < 0 && <Text size="sm" color="secondary">({formatRupiah(diff)})</Text>}
            </HStack>
          </VStack>
        );
      }
    },
    { key: "qty", header: "Vol. Kontrak", width: pixel(120), renderCell: (row) => `${formatNumber(row.qty, 2)} ${row.unit ?? ""}` },
    { key: "sisa", header: "Sisa", width: pixel(120), renderCell: (row) => `${formatNumber(row.sisa, 2)} ${row.unit ?? ""}` },
    {
      key: "subtotal", header: "Total Harga (BOM vs PO)", width: pixel(200), renderCell: (row) => {
        const bomItem = bomData.find(b => b.item_id === row.item_id);
        const bomPrice = bomItem?.price || 0;
        const totalBOM = (row.qty || 0) * bomPrice;
        const totalPO = (row.qty || 0) * (row.price || 0);
        const diff = totalPO - totalBOM;
        return (
          <VStack gap={1}>
            <Text size="sm" color="secondary">BOM: {formatRupiah(totalBOM)}</Text>
            <HStack gap={2}>
              <Text weight="medium">PO: {formatRupiah(totalPO)}</Text>
              {diff > 0 && <Text size="sm" color="secondary">(+{formatRupiah(diff)})</Text>}
              {diff < 0 && <Text size="sm" color="secondary">({formatRupiah(diff)})</Text>}
            </HStack>
          </VStack>
        );
      }
    },
    {
      key: "progress", header: "Realisasi", width: proportional(1.5), renderCell: (row) => {
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
      textOverflow="truncate"
      columns={itemColumns}
      data={items}
      idKey="po_item_id"
      emptyState={<VStack align="center" padding={4}><Text color="secondary">Tidak ada item dalam PO ini.</Text></VStack>}
    />
  );
}
