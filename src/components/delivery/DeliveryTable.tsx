import { useEffect, useState } from "react";
import { HStack, Button, Table, TextInput, Selector, Text, VStack, Card, Badge } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getDeliveries, deleteDelivery, type Delivery } from "@/db/queries/field";
import { formatDate } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";

interface DeliveryTableProps {
  onRefresh?: () => void;
  refreshTrigger?: number; // to allow parent to trigger refresh
}

export function DeliveryTable({ onRefresh, refreshTrigger }: DeliveryTableProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  async function load() {
    const d = await getDeliveries({
      project_id: selectedProjectId || undefined,
    });
    setDeliveries(d);
  }

  useEffect(() => { load(); }, [refreshTrigger, selectedProjectId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDelivery(deleteTarget);
      setDeleteTarget(null);
      await load();
      if (onRefresh) onRefresh();
    } finally {
      setDeleting(false);
    }
  }



  const columns = [
    { key: "delivery_id", header: "ID Pengiriman", width: pixel(140), renderCell: (row: Delivery) => `DLV-${row.delivery_id}` },
    { key: "delivery_date", header: "Tanggal", width: pixel(120), renderCell: (row: Delivery) => formatDate(row.delivery_date) },
    { key: "po_id", header: "No. PO", width: pixel(120), renderCell: (row: Delivery) => `PO-${row.po_id}` },
    { key: "project_name", header: "Proyek", width: proportional(1.5), renderCell: (row: Delivery) => row.project_name || "—" },
    { 
      key: "vendor_names", header: "Vendor Pemasok", width: proportional(1.5), 
      renderCell: (row: Delivery) => (
        <HStack gap={1} style={{ flexWrap: 'wrap' }}>
          {row.vendor_names ? row.vendor_names.split(',').map((v: string, i: number) => (
            <Badge key={i} variant="neutral" label={v.trim()} />
          )) : "—"}
        </HStack>
      )
    },
    { key: "item_count", header: "Total Item", width: pixel(120), renderCell: (row: Delivery) => `${row.item_count} Item` },
    {
      key: "actions", header: "", width: pixel(100),
      renderCell: (row: Delivery) => (
        <HStack gap={1} justify="end">
          <Button size="sm" label="Hapus" variant="destructive" onClick={() => setDeleteTarget(row.delivery_id)} />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={4}>
      <Card padding={0}>
        <Table
          textOverflow="truncate"
          columns={columns as any}
          data={deliveries as any}
          idKey="delivery_id"
          emptyState={
            <VStack align="center" padding={8}>
              <Text color="secondary">Tidak ada data pengiriman yang cocok.</Text>
            </VStack>
          }
        />
      </Card>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Log Pengiriman"
        message="Apakah Anda yakin ingin menghapus data pengiriman ini? Jumlah sisa PO terkait akan bertambah kembali."
        isLoading={deleting}
      />
    </VStack>
  );
}
