import { useEffect, useState } from "react";
import { Table } from "@astryxdesign/core";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useAppStore } from "@/store/useAppStore";
import { usePOStore } from "@/store/usePOStore";
import { type PORow, usePOTableColumns } from "./table/usePOTableColumns";

interface POTableProps {
  onEdit: (id: string) => void;
}

export function POTable({ onEdit }: POTableProps) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId),
    { pos, loadAllPOs, deletePO } = usePOStore(),
    [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null),
    [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAllPOs(selectedProjectId || undefined);
  }, [selectedProjectId, loadAllPOs]);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deletePO(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns = usePOTableColumns({
    onEdit,
    setDeleteTarget,
  });

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={pos as PORow[]}
        idKey="po_id"
        emptyState={<TableEmptyState message="Belum ada PO. Klik 'Buat Baru' untuk memulai." />}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus PO"
        message={`Hapus PO "${deleteTarget?.label}"? Semua item dan pengiriman terkait akan ikut terhapus.`}
        isLoading={deleting}
      />
    </>
  );
}
