import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { Table, useTableRowIndex } from "@astryxdesign/core/Table";
import { type ReceiptRow, useReceiptColumns } from "./table/useReceiptColumns";

export function ReceiptTable() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { receipts, loadAllReceipts, deleteReceipt } = useReceiptStore();

  useEffect(() => {
    loadAllReceipts(selectedProjectId || undefined);
  }, [selectedProjectId, loadAllReceipts]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await deleteReceipt(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns = useReceiptColumns({ setDeleteTarget });

  const rowIndexPlugin = useTableRowIndex({
    data: receipts as ReceiptRow[],
    getRowKey: (item) => item.receipt_id,
    label: "#",
  });

  return (
    <>
      <Table
        hasHover
        idKey="receipt_id"
        plugins={{ rowIndex: rowIndexPlugin }}
        textOverflow="truncate"
        columns={columns}
        data={receipts as ReceiptRow[]}
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
