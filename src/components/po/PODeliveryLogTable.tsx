import { Table, HStack, IconButton } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { Pencil, Trash2 } from "lucide-react";
import { formatDate, formatNumber } from "@/utils/formatters";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useNavigate } from "@tanstack/react-router";
import { useToast } from "@astryxdesign/core/Toast";
import { useState } from "react";
import { usePOStore } from "@/store/usePOStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import type { DeliveryItemByPO } from "@/db/repositories";

export function PODeliveryLogTable() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { currentDeliveryItems: deliveryItems } = usePOStore();
  const { deleteDelivery } = useDeliveryStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDelivery(deleteTarget.id);
      showToast({ body: "Pengiriman berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus pengiriman", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const deliveryColumns: TableColumn<DeliveryItemByPO>[] = [
    {
      key: "delivery_id",
      header: "Kode",
      width: pixel(100),
      renderCell: (row) => `DLV-${String(row.delivery_id).padStart(4, "0")}`
    },
    {
      key: "delivery_date",
      header: "Tanggal Kirim",
      width: pixel(120),
      renderCell: (row) => formatDate(row.delivery_date)
    },
    {
      key: "item_name",
      header: "Barang / Material",
      width: proportional(1),
      renderCell: (row) => row.item_name
    },
    {
      key: "qty",
      header: "Volume Diterima",
      width: pixel(180),
      renderCell: (row) => `${formatNumber(row.qty, 2)} ${row.unit ?? ""}`
    },
    {
      key: "actions",
      header: "",
      width: pixel(100),
      renderCell: (row) => (
        <HStack justify="end" gap={2}>
          <IconButton
            size="sm"
            variant="secondary"
            label="Edit"
            icon={<Pencil size={16} />}
            onClick={() => navigate({ to: `/delivery/${row.delivery_id}/edit` })} />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteTarget({ id: row.delivery_id!, label: `Pengiriman ${formatDate(row.delivery_date)} - ${row.item_name}` })} />
        </HStack>
      )
    },
  ];

  return (
    <>
      <Table
        verticalAlign="top"
        hasHover
        textOverflow="truncate"
        columns={deliveryColumns}
        data={deliveryItems}
        idKey="delivery_item_id"
        emptyState={<TableEmptyState message="Belum ada realisasi pengiriman material untuk PO ini." />}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Pengiriman"
        message={`Hapus ${deleteTarget?.label}? Semua item dalam log pengiriman ini akan ikut terhapus.`}
        isLoading={deleting}
      />
    </>
  );
}
