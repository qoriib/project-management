import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HStack, Table, Badge, IconButton } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { deliveryRepo, type DeliverySummary } from "@/db/repositories";
import { formatDate } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";

type DeliveryRow = DeliverySummary & Record<string, unknown>;

interface DeliveryTableProps {
  onRefresh?: () => void;
  refreshTrigger?: number;
}

export function DeliveryTable({ onRefresh, refreshTrigger }: DeliveryTableProps) {
  const navigate = useNavigate();
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

  const columns: TableColumn<DeliveryRow>[] = [
    {
      key: "delivery_id",
      header: "ID Pengiriman",
      width: pixel(140),
      renderCell: (row) => `DLV-${row.delivery_id}`
    },
    {
      key: "delivery_date",
      header: "Tanggal",
      width: pixel(120),
      renderCell: (row) => formatDate(row.delivery_date)
    },
    {
      key: "po_id",
      header: "No. PO",
      width: pixel(120),
      renderCell: (row) => `PO-${String(row.po_id).padStart(4, "0")}`
    },
    {
      key: "vendor_names",
      header: "Vendor Pemasok",
      width: proportional(1.5),
      renderCell: (row) => (
        <HStack gap={1} style={{ flexWrap: 'wrap' }}>
          {row.vendor_names ? row.vendor_names.split(',').map((v: string, i: number) => (
            <Badge key={i} variant="neutral" label={v.trim()} />
          )) : "—"}
        </HStack>
      )
    },
    {
      key: "item_count",
      header: "Total Item",
      width: pixel(120),
      renderCell: (row) => `${row.item_count} Item`
    },
    {
      key: "actions",
      header: "",
      width: pixel(120),
      renderCell: (row) => (
        <HStack justify="end" gap={2}>
          <IconButton
            size="sm"
            variant="secondary"
            icon={<Pencil size={16} />}
            label="Edit"
            onClick={() => navigate({ to: '/delivery/$id/edit', params: { id: String(row.delivery_id) } })}
          />
          <IconButton
            size="sm"
            variant="destructive"
            icon={<Trash2 size={16} />}
            label="Hapus"
            onClick={() => setDeleteTarget(row.delivery_id)}
          />
        </HStack>
      )
    },
  ];

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={deliveries as DeliveryRow[]}
        idKey="delivery_id"
        emptyState={<TableEmptyState message="Tidak ada data pengiriman yang cocok." />}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Log Pengiriman"
        message="Apakah Anda yakin ingin menghapus data pengiriman ini? Jumlah sisa PO terkait akan bertambah kembali."
        isLoading={deleting}
      />
    </>
  );
}
