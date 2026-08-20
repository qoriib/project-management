import { useEffect, useState } from "react";
import { Table } from "@astryxdesign/core";
import { useTableRowIndex } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useAppStore } from "@/store/useAppStore";
import { useOrderStore } from "@/store/useOrderStore";
import { type PORow, useOrderTableColumns } from "./table/useOrderTableColumns";

interface OrderTableProps {
  onEdit: (id: string) => void;
}

export function OrderTable({ onEdit }: OrderTableProps) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { orders, loadAllOrders, deleteOrder } = useOrderStore();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAllOrders(selectedProjectId || undefined);
  }, [selectedProjectId, loadAllOrders]);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteOrder(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns = useOrderTableColumns({
    onEdit,
    setDeleteTarget,
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
        plugins={{ rowIndex: rowIndexPlugin }}
        textOverflow="truncate"
        columns={columns}
        data={orders as PORow[]}
        emptyState={<TableEmptyState message="Belum ada Order. Klik 'Buat Baru' untuk memulai." />}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Order"
        message={`Hapus Order "${deleteTarget?.label}"? Semua item dan Penerimaan terkait akan ikut terhapus.`}
        isLoading={deleting}
      />
    </>
  );
}
