import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { Table, useTableRowIndex } from "@astryxdesign/core/Table";
import { type DeliveryRow, useDeliveryColumns } from "./table/useDeliveryColumns";

export function DeliveryTable() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const columns = useDeliveryColumns({ setDeleteTarget });

  const rowIndexPlugin = useTableRowIndex({
    data: deliveries as DeliveryRow[],
    getRowKey: (item) => item.delivery_id,
    label: "No.",
  });

  return (
    <>
      <Table
        hasHover
        idKey="delivery_id"
        plugins={{ rowIndex: rowIndexPlugin }}
        textOverflow="truncate"
        columns={columns}
        data={deliveries as DeliveryRow[]}
        emptyState={<TableEmptyState message="Tidak ada data Penerimaan yang cocok." />}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Log Penerimaan"
        message="Apakah Anda yakin ingin menghapus data Penerimaan ini?"
        isLoading={deleting}
      />
    </>
  );
}
