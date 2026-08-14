import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, Table, HStack, IconButton } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import type { Unit } from "@/db/repositories";

interface MasterUnitTableProps {
  onEdit: (unit: Unit) => void;
}

type UnitRow = Unit & { count: number } & Record<string, unknown>;

export function MasterUnitTable({ onEdit }: MasterUnitTableProps) {
  const showToast = useToast();

  const { units, items, deleteUnit } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteUnit(deleteTarget.id);
      showToast({ body: "Satuan berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus satuan", type: "error" });
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
      key: "unit_id",
      header: "Kode",
      width: pixel(100),
      renderCell: (row: UnitRow) => `STN-${String(row.unit_id).padStart(4, '0')}`
    },
    {
      key: "unit_name",
      header: "Satuan",
      width: proportional(1)
    },
    {
      key: "count",
      header: "Jumlah Item",
      width: pixel(150),
      renderCell: (row: UnitRow) => String(row.count)
    },
    {
      key: "actions",
      header: "",
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

  return (
    <>
      <Card>
        <Table
          textOverflow="truncate"
          columns={columns}
          data={unitRows as UnitRow[]}
          idKey="unit_id"
          emptyState={<TableEmptyState message="Belum ada satuan." />}
        />
      </Card>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan jika sudah terikat transaksi.`}
        isLoading={deleting}
      />
    </>
  );
}
