import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HStack, IconButton, Table } from "@astryxdesign/core";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { handleFormError } from "@/utils/form";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { ItemCategoryWithRelation } from "@/db/repositories";

interface MasterCategoryTableProps {
  onEdit: (category: ItemCategoryWithRelation) => void;
}

interface CategoryRow extends ItemCategoryWithRelation, Record<string, unknown> {}

export function MasterCategoryTable({ onEdit }: MasterCategoryTableProps) {
  const showToast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { categories, deleteCategory } = useMasterStore();

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

  const columns: TableColumn<CategoryRow>[] = [
    {
      header: "Prefix",
      key: "prefix",
      width: pixel(80),
      renderCell: (row: CategoryRow) => (row.prefix ? <EntityCode id={row.prefix} /> : "-"),
    },
    {
      header: "Kode Kategori",
      key: "category_code",
      width: pixel(150),
      renderCell: (row: CategoryRow) => (row.category_code ? <EntityCode id={row.category_code} /> : "-"),
    },
    {
      header: "Nama Kategori",
      key: "category_name",
      width: proportional(1),
      renderCell: (row: CategoryRow) => row.category_name || "-",
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(120),
      renderCell: (row: CategoryRow) => (
        <HStack gap={2} justify="end">
          <IconButton size="sm" variant="secondary" label="Edit" icon={<Pencil />} onClick={() => onEdit(row)} />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 />}
            isDisabled={row.has_relation}
            onClick={() => setDeleteTarget({ id: row.category_id, label: row.category_name })}
          />
        </HStack>
      ),
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: categories as CategoryRow[],
    getRowKey: (item) => item.category_id,
    label: "#",
  });

  return (
    <>
      <Table
        hasHover
        idKey="category_id"
        plugins={{ rowIndex: rowIndexPlugin }}
        textOverflow="truncate"
        columns={columns}
        data={categories as CategoryRow[]}
        emptyState={<TableEmptyState message="Belum ada kategori." />}
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
