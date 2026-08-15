import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { EntityCode } from "@/components/shared/EntityCode";
import { HStack, Table, Badge, IconButton, Timestamp } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { type DeliverySummary } from "@/db/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";

type DeliveryRow = DeliverySummary & Record<string, unknown>;

export function DeliveryTable() {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { deliveries, loadAllDeliveries, deleteDelivery } = useDeliveryStore();

  useEffect(() => {
    loadAllDeliveries(selectedProjectId || undefined);
  }, [selectedProjectId, loadAllDeliveries]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDelivery(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<DeliveryRow>[] = [
    {
      key: "delivery_id",
      header: "No. Pengiriman",
      width: pixel(140),
      renderCell: (row) => <EntityCode prefix="DLV" id={row.delivery_id} />
    },
    {
      key: "delivery_date",
      header: "Tanggal",
      width: pixel(120),
      renderCell: (row) => <Timestamp value={row.delivery_date} format="system_date" size="base" />
    },
    {
      key: "po_id",
      header: "Ref. PO",
      width: pixel(120),
      renderCell: (row) => <EntityCode prefix="PO" id={row.po_id} />
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
      header: "Aksi",
      align: "end",
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
