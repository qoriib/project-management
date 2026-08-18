import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Table, HStack, IconButton, Text } from "@astryxdesign/core";
import { pixel, proportional, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";

import type { ItemCategory } from "@/db/repositories";

interface MasterCategoryTableProps {
  onEdit: (category: ItemCategory) => void;
}

type CategoryRow = ItemCategory & { count: number } & Record<string, unknown>;

export function MasterCategoryTable({ onEdit }: MasterCategoryTableProps) {
  const showToast = useToast();

  const { categories, items, deleteCategory } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const columns: TableColumn<CategoryRow>[] = [
    {
      key: "prefix",
      header: "Prefix",
      width: pixel(80),
      renderCell: (row: CategoryRow) => <EntityCode prefix="" id={row.prefix} />
    },

    {
      key: "category_code",
      header: "Kode Kategori",
      width: pixel(150),
      renderCell: (row: CategoryRow) => <EntityCode prefix="" id={row.category_code} />
    },
    {
      key: "category_name",
      header: "Nama Kategori",
      width: proportional(1)
    },
    {
      key: "count",
      header: "Jumlah Item",
      width: pixel(150),
      align: "end",
      renderCell: (row: CategoryRow) => <Text type="code">{String(row.count)}</Text>
    },
    {
      key: "actions",
      header: "",
      width: pixel(120),
      renderCell: (row: CategoryRow) => (
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
            onClick={() => setDeleteTarget({ id: row.category_id, label: row.category_name })}
          />
        </HStack>
      ),
    },
  ];

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={categoryRows as CategoryRow[]}
        idKey="category_id"
        emptyState={<TableEmptyState message="Belum ada kategori." />}
      />
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
