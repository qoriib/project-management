import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HStack, IconButton, Table } from "@astryxdesign/core";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { handleFormError } from "@/utils/form";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { UnitWithRelation } from "@/db/repositories";

interface MasterUnitTableProps {
  onEdit: (unit: UnitWithRelation) => void;
}

interface UnitRow extends UnitWithRelation, Record<string, unknown> {}

export function MasterUnitTable({ onEdit }: MasterUnitTableProps) {
  const showToast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { units, deleteUnit } = useMasterStore();

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteUnit(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<UnitRow>[] = [
    {
      header: "Nama Satuan",
      key: "unit_name",
      width: proportional(1),
      renderCell: (row: UnitRow) => row.unit_name || "-",
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(120),
      renderCell: (row: UnitRow) => (
        <HStack gap={2} justify="end">
          <IconButton size="sm" variant="secondary" label="Edit" icon={<Pencil />} onClick={() => onEdit(row)} />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 />}
            isDisabled={row.has_relation}
            onClick={() => setDeleteTarget({ id: row.unit_id, label: row.unit_name })}
          />
        </HStack>
      ),
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: units as UnitRow[],
    getRowKey: (item) => item.unit_id,
    label: "#",
  });

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={units as UnitRow[]}
        idKey="unit_id"
        plugins={{ rowIndex: rowIndexPlugin }}
        emptyState={<TableEmptyState message="Belum ada satuan." />}
      />
      <AlertDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onAction={handleDelete}
        title="Hapus Master Data"
        description={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan.`}
        actionLabel="Hapus"
        cancelLabel="Batal"
        isActionLoading={deleting}
      />
    </>
  );
}
