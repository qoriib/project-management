import { useEffect, useState } from "react";
import { EmptyState, Table } from "@astryxdesign/core";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { useToast } from "@astryxdesign/core/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { handleFormError } from "@/utils/form";
import { useTableStickyColumns } from "@astryxdesign/core/Table";
import { type ReceiptRow, useReceiptColumns } from "./table/useReceiptColumns";

export function ReceiptTable() {
  const showToast = useToast();
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
      showToast({ body: "Penerimaan berhasil dihapus", type: "info" });
    } catch (error: unknown) {
      handleFormError(error, showToast);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = useReceiptColumns({ setDeletingId });

  const rowIndexPlugin = useTableRowIndex({
    data: receipts as ReceiptRow[],
    getRowKey: (item) => item.receipt_id,
  });

  const stickyColumns = useTableStickyColumns<ReceiptRow>({
    startKeys: ["__rowIndex", "receipt_code"],
    endKeys: ["actions"],
  });

  return (
    <>
      <Table
        hasHover
        idKey="receipt_id"
        textOverflow="truncate"
        columns={columns}
        data={receipts as ReceiptRow[]}
        plugins={{ rowIndex: rowIndexPlugin, stickyColumns }}
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
