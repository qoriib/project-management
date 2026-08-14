import { Table, HStack, IconButton, Text, VStack } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { Pencil, Trash2 } from "lucide-react";
import { formatDate, formatNumber } from "@/utils/formatters";
import { useNavigate } from "@tanstack/react-router";
import type { DeliveryItemByPO } from "@/db/repositories";

interface PODeliveryLogTableProps {
  deliveryItems: DeliveryItemByPO[];
  onDeleteRequest: (id: number, label: string) => void;
}

export function PODeliveryLogTable({ deliveryItems, onDeleteRequest }: PODeliveryLogTableProps) {
  const navigate = useNavigate();

  const deliveryColumns: TableColumn<DeliveryItemByPO>[] = [
    { key: "delivery_id", header: "Kode", width: pixel(120), renderCell: (row) => `DLV-${String(row.delivery_id).padStart(4, "0")}` },
    { key: "delivery_date", header: "Tanggal Kirim", width: pixel(140), renderCell: (row) => formatDate(row.delivery_date) },
    { key: "item_name", header: "Barang / Material", width: proportional(2), renderCell: (row) => row.item_name },
    { key: "qty", header: "Volume Diterima", width: proportional(1), renderCell: (row) => `${formatNumber(row.qty, 2)} ${row.unit ?? ""}` },
    {
      key: "actions", header: "", width: pixel(100), renderCell: (row) => (
        <HStack gap={1}>
          <IconButton size="sm" variant="secondary" icon={<Pencil size={16} />} label="Edit" onClick={() => navigate({ to: `/delivery/${row.delivery_id}/edit` })} />
          <IconButton size="sm" variant="destructive" icon={<Trash2 size={16} />} label="Hapus" onClick={() => onDeleteRequest(row.delivery_id!, `Pengiriman ${formatDate(row.delivery_date)} - ${row.item_name}`)} />
        </HStack>
      )
    },
  ];

  return (
    <Table
      textOverflow="truncate"
      columns={deliveryColumns}
      data={deliveryItems}
      idKey="delivery_item_id"
      emptyState={<VStack align="center" padding={4}><Text color="secondary">Belum ada realisasi pengiriman material untuk PO ini.</Text></VStack>}
    />
  );
}
