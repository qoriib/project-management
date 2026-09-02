import { useEffect, useState } from "react";
import { EmptyState, Table } from "@astryxdesign/core";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { useAppStore } from "@/store/useAppStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
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
        emptyState={<EmptyState isCompact title="Belum ada penerimaan (NP)" />}
      />
      <AlertDialog
        title="Hapus Penerimaan"
        description="Hapus data penerimaan ini? Tindakan ini tidak dapat dibatalkan."
        actionLabel="Hapus"
        cancelLabel="Batal"
        isOpen={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onAction={handleDelete}
        isActionLoading={isDeleting}
      />
    </>
  );
}
