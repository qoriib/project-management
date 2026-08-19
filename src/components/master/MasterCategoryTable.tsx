import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HStack, IconButton, Table, Text } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";

import type { ItemCategory } from "@/db/repositories";

interface MasterCategoryTableProps {
  onEdit: (category: ItemCategory) => void;
}

interface CategoryRow extends ItemCategory, Record<string, unknown> {
  count: number;
}

export function MasterCategoryTable({ onEdit }: MasterCategoryTableProps) {
  const showToast = useToast(),
    { categories, items, deleteCategory } = useMasterStore(),
    [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null),
    [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteCategory(deleteTarget.id);
      showToast({ body: "Kategori berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (error: any) {
      showToast({ body: error.message || "Gagal menghapus kategori", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const categoryRows = categories.map((category) => ({
      ...category,
      count: items.filter((item) => item.category_id === category.category_id).length,
    })),
    columns: TableColumn<CategoryRow>[] = [
      {
        header: "Prefix",
        key: "prefix",
        renderCell: (row: CategoryRow) => <EntityCode prefix="" id={row.prefix} />,
        width: pixel(80),
      },

      {
        header: "Kode Kategori",
        key: "category_code",
        renderCell: (row: CategoryRow) => <EntityCode prefix="" id={row.category_code} />,
        width: pixel(150),
      },
      {
        header: "Nama Kategori",
        key: "category_name",
        width: proportional(1),
      },
      {
        align: "end",
        header: "Jumlah Item",
        key: "count",
        renderCell: (row: CategoryRow) => <Text type="code">{String(row.count)}</Text>,
        width: pixel(150),
      },
      {
        header: "",
        key: "actions",
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
        width: pixel(120),
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
