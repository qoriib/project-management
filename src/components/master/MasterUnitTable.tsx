import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HStack, IconButton, Table, Text } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";

import type { Unit } from "@/db/repositories";

interface MasterUnitTableProps {
  onEdit: (unit: Unit) => void;
}

interface UnitRow extends Unit, Record<string, unknown> {
  count: number;
}

export function MasterUnitTable({ onEdit }: MasterUnitTableProps) {
  const showToast = useToast(),
    { units, items, deleteUnit } = useMasterStore(),
    [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null),
    [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteUnit(deleteTarget.id);
      showToast({ body: "Satuan berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (error: any) {
      showToast({ body: error.message || "Gagal menghapus satuan", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const unitRows = units.map((unit) => ({
      ...unit,
      count: items.filter((item) => item.unit_id === unit.unit_id).length,
    })),
    columns: TableColumn<UnitRow>[] = [
      {
        header: "Nama Satuan",
        key: "unit_name",
        width: proportional(1),
      },
      {
        align: "end",
        header: "Jumlah Item",
        key: "count",
        renderCell: (row: UnitRow) => <Text type="code">{String(row.count)}</Text>,
        width: pixel(150),
      },
      {
        header: "",
        key: "actions",
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
        width: pixel(120),
      },
    ];

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={unitRows as UnitRow[]}
        idKey="unit_id"
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
