import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, Table, HStack, Text, VStack, IconButton } from "@astryxdesign/core";
import { proportional } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@astryxdesign/core/Toast";
import type { Unit } from "@/db/repositories";
import { useMasterStore } from "@/store/useMasterStore";

interface MasterUnitTableProps {
  onEdit: (unit: Unit) => void;
}

export function MasterUnitTable({ onEdit }: MasterUnitTableProps) {
  const { units, items, deleteUnit } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const showToast = useToast();

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

  const columns = [
    { key: "unit_name", header: "Satuan", width: proportional(1) },
    { key: "count", header: "Jumlah Item", width: proportional(1), renderCell: (row: { count: number }) => String(row.count) },
    {
      key: "actions", header: "", width: proportional(1),
      renderCell: (row: Unit & { count: number }) => (
        <HStack gap={1}>
          <IconButton size="sm" variant="secondary"  icon={<Pencil size={16} />} label="Edit"  onClick={() => onEdit(row)} />
          <IconButton size="sm" variant="destructive"  icon={<Trash2 size={16} />} label="Hapus"  isDisabled={row.count > 0} onClick={() => setDeleteTarget({ id: row.unit_id, label: row.unit_name })} />
        </HStack>
      ),
    },
  ];

  return (
    <>
      <Card padding={0}>
        <Table
          textOverflow="truncate"
          columns={columns as any}
          data={unitRows as any}
          idKey="unit_id"
          emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada satuan.</Text></VStack>}
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
