import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { Table, useTableRowIndex } from "@astryxdesign/core/Table";
import { type ReceiptRow, useReceiptColumns } from "./table/useReceiptColumns";

export function ReceiptTable() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { receipts, loadAllReceipts, deleteReceipt } = useReceiptStore();

  useEffect(() => {
    loadAllReceipts(selectedProjectId || undefined);
  }, [selectedProjectId, loadAllReceipts]);

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);

    try {
      await deleteReceipt(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = useReceiptColumns({ setDeletingId });

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
        textOverflow="truncate"
        columns={columns}
        data={receipts as ReceiptRow[]}
        plugins={{ rowIndex: rowIndexPlugin }}
        emptyState={<TableEmptyState message="Tidak ada data Penerimaan yang cocok." />}
      />
      <ConfirmDialog
        title="Hapus Log Penerimaan"
        message="Apakah Anda yakin ingin menghapus data Penerimaan ini?"
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
