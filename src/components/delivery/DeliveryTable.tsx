import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HStack, Button, Table, Text, VStack, Card, Badge } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deliveryRepo, type DeliverySummary } from "@/db/repositories";
import { formatDate } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";

interface DeliveryTableProps {
  onRefresh?: () => void;
  refreshTrigger?: number; // to allow parent to trigger refresh
}

export function DeliveryTable({ onRefresh, refreshTrigger }: DeliveryTableProps) {
  const [deliveries, setDeliveries] = useState<DeliverySummary[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  async function load() {
    const d = await deliveryRepo.findAllWithSummary({
      project_id: selectedProjectId || undefined,
    });
    setDeliveries(d);
  }

  useEffect(() => { load(); }, [refreshTrigger, selectedProjectId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deliveryRepo.delete(deleteTarget);
      setDeleteTarget(null);
      await load();
      if (onRefresh) onRefresh();
    } finally {
      setDeleting(false);
    }
  }



  const columns = [
    { key: "delivery_id", header: "ID Pengiriman", width: pixel(140), renderCell: (row: DeliverySummary) => `DLV-${row.delivery_id}` },
    { key: "delivery_date", header: "Tanggal", width: pixel(120), renderCell: (row: DeliverySummary) => formatDate(row.delivery_date) },
    { key: "po_id", header: "No. PO", width: pixel(120), renderCell: (row: DeliverySummary) => `PO-${row.po_id}` },
    { key: "project_name", header: "Proyek", width: proportional(1.5), renderCell: (row: DeliverySummary) => row.project_name || "—" },
    {
      key: "vendor_names", header: "Vendor Pemasok", width: proportional(1.5),
      renderCell: (row: DeliverySummary) => (
        <HStack gap={1} style={{ flexWrap: 'wrap' }}>
          {row.vendor_names ? row.vendor_names.split(',').map((v: string, i: number) => (
            <Badge key={i} variant="neutral" label={v.trim()} />
          )) : "—"}
        </HStack>
      )
    },
    { key: "item_count", header: "Total Item", width: pixel(120), renderCell: (row: DeliverySummary) => `${row.item_count} Item` },
    {
      key: "actions", header: "", width: pixel(180),
      renderCell: (row: DeliverySummary) => (
        <HStack gap={2}>
          <Link to="/delivery/$id/edit" params={{ id: String(row.delivery_id) }}>
            <Button size="sm" variant="secondary" label="Edit" />
          </Link>
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget(row.delivery_id)} />
        </HStack>
      )
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
