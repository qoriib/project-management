import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HStack, IconButton, Table, Text } from "@astryxdesign/core";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { handleFormError } from "@/utils/form";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { ItemCategory } from "@/db/repositories";

interface MasterCategoryTableProps {
  onEdit: (category: ItemCategory) => void;
}

interface CategoryRow extends ItemCategory, Record<string, unknown> {
  count: number;
}

export function MasterCategoryTable({ onEdit }: MasterCategoryTableProps) {
  const showToast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { categories, items, deleteCategory } = useMasterStore();

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error: any) {
      handleFormError(error, showToast);
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
      header: "Prefix",
      key: "prefix",
      width: pixel(80),
      renderCell: (row: CategoryRow) => <EntityCode id={row.prefix} />,
    },

    {
      header: "Kode Kategori",
      key: "category_code",
      width: pixel(150),
      renderCell: (row: CategoryRow) => <EntityCode id={row.category_code} />,
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
      width: pixel(150),
      renderCell: (row: CategoryRow) => <Text type="code">{String(row.count)}</Text>,
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
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
        idKey="category_id"
        textOverflow="truncate"
        columns={columns}
        data={categoryRows as CategoryRow[]}
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
