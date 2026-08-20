import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HStack, IconButton, Table, Text } from "@astryxdesign/core";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { handleFormError } from "@/utils/form";
import { type TableColumn, pixel, proportional, useTableRowIndex } from "@astryxdesign/core/Table";
import type { Unit } from "@/db/repositories";

interface MasterUnitTableProps {
  onEdit: (unit: Unit) => void;
}

interface UnitRow extends Unit, Record<string, unknown> {
  count: number;
}

export function MasterUnitTable({ onEdit }: MasterUnitTableProps) {
  const showToast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { units, items, deleteUnit } = useMasterStore();

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

  const unitRows = units.map((unit) => ({
    ...unit,
    count: items.filter((item) => item.unit_id === unit.unit_id).length,
  }));

  const columns: TableColumn<UnitRow>[] = [
    {
      header: "Nama Satuan",
      key: "unit_name",
      width: proportional(1),
    },
    {
      align: "end",
      header: "Jumlah Item",
      key: "count",
      width: pixel(150),
      renderCell: (row: UnitRow) => <Text type="code">{String(row.count)}</Text>,
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(120),
      renderCell: (row: UnitRow) => (
        <HStack gap={2} justify="end">
          <IconButton
            size="sm"
            variant="secondary"
            label="Edit"
            icon={<Pencil size={16} />}
            onClick={() => onEdit(row)}
          />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 size={16} />}
            isDisabled={row.count > 0}
            onClick={() => setDeleteTarget({ id: row.unit_id, label: row.unit_name })}
          />
        </HStack>
      ),
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: unitRows as UnitRow[],
    getRowKey: (item) => item.unit_id,
    label: "#",
  });

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={unitRows as UnitRow[]}
        idKey="unit_id"
        plugins={{ rowIndex: rowIndexPlugin }}
        emptyState={<TableEmptyState message="Belum ada satuan." />}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan jika sudah terikat transaksi.`}
        isLoading={deleting}
      />
    </>
  );
}
