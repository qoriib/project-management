import { useEffect, useState } from "react";
import { Table } from "@astryxdesign/core";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useOrderStore } from "@/store/useOrderStore";
import { type PORow, useOrderTableColumns } from "./table/useOrderTableColumns";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";

interface OrderTableProps {
  onEdit: (id: string) => void;
}

export function OrderTable({ onEdit }: OrderTableProps) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [deletingId, setDeletingId] = useState<{ id: string; label: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { orders, loadAllOrders, deleteOrder } = useOrderStore();

  useEffect(() => {
    loadAllOrders(selectedProjectId || undefined);
  }, [selectedProjectId, loadAllOrders]);

  async function handleDelete() {
    if (!deletingId) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteOrder(deletingId.id);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = useOrderTableColumns({
    onEdit,
    setDeleteTarget: setDeletingId,
  });

  const rowIndexPlugin = useTableRowIndex({
    data: orders as PORow[],
    getRowKey: (item) => item.order_id,
    label: "#",
  });

  return (
    <>
      <Table
        hasHover
        idKey="order_id"
        textOverflow="truncate"
        columns={columns}
        data={orders as PORow[]}
        plugins={{ rowIndex: rowIndexPlugin }}
        emptyState={<TableEmptyState message="Belum ada Order." />}
      />
      <AlertDialog
        title="Hapus Order"
        description={`Hapus Order "${deletingId?.label}"? Semua item dan Penerimaan terkait akan ikut terhapus.`}
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
