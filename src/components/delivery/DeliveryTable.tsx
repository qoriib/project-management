import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { type DeliveryRow, useDeliveryColumns } from "./table/useDeliveryColumns";
import { Table } from "@astryxdesign/core";

export function DeliveryTable() {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null),
    [deleting, setDeleting] = useState(false),
    selectedProjectId = useAppStore((s) => s.selectedProjectId),
    { deliveries, loadAllDeliveries, deleteDelivery } = useDeliveryStore();

  useEffect(() => {
    loadAllDeliveries(selectedProjectId || undefined);
  }, [selectedProjectId, loadAllDeliveries]);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await deleteDelivery(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns = useDeliveryColumns({ setDeleteTarget });

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
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Log Pengiriman"
        message="Apakah Anda yakin ingin menghapus data pengiriman ini? Jumlah sisa PO terkait akan bertambah kembali."
        isLoading={deleting}
      />
    </>
  );
}
