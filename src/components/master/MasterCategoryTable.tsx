import { useState } from "react";
import { Card, Button, Table, HStack, Text, VStack } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import type { ItemCategory } from "@/db/repositories";

interface MasterCategoryTableProps {
  onEdit: (category: ItemCategory) => void;
}

export function MasterCategoryTable({ onEdit }: MasterCategoryTableProps) {
  const { categories, items, deleteCategory } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const showToast = useToast();

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      showToast({ body: "Kategori berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus kategori", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const categoryRows = categories.map((category) => ({
    ...category,
    count: items.filter((item) => item.category_id === category.category_id).length,
  }));

  const columns = [
    {
      key: "category_id",
      header: "Kode Kategori",
      width: pixel(180),
      renderCell: (row: ItemCategory) => String(row.category_id).padStart(4, '0')
    },
    { key: "category_name", header: "Nama Kategori", width: proportional(1) },
    { key: "count", header: "Jumlah Item", width: pixel(140), renderCell: (row: { count: number }) => String(row.count) },
    {
      key: "actions", header: "", width: pixel(150),
      renderCell: (row: ItemCategory & { count: number }) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => onEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" isDisabled={row.count > 0} onClick={() => setDeleteTarget({ id: row.category_id, label: row.category_name })} />
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
          data={categoryRows as any}
          idKey="category_id"
          emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada kategori.</Text></VStack>}
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
