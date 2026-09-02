import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, Button, EmptyState, HStack, IconButton, Table } from "@astryxdesign/core";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { EntityCode } from "@/components/shared/EntityCode";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { handleFormError } from "@/utils/form";
import { formatItemCode } from "@/utils/formatters";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { ItemWithDetails } from "@/db/repositories";

interface MasterItemTableProps {
  onEdit: (item: ItemWithDetails) => void;
}

interface ItemRow extends ItemWithDetails, Record<string, unknown> {}

export function MasterItemTable({ onEdit }: MasterItemTableProps) {
  const showToast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [priceItem, setPriceItem] = useState<ItemWithDetails | null>(null);

  const { items, deleteItem } = useMasterStore();

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<ItemRow>[] = [
    {
      header: "Kode Item",
      key: "item_code",
      width: pixel(180),
      renderCell: (row: ItemRow) => {
        const code = formatItemCode(row);
        return code ? <EntityCode id={code} /> : "-";
      },
    },

    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(1),
      renderCell: (row: ItemRow) => row.item_name || "-",
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(120),
      renderCell: (row: ItemRow) => row.unit_name || "-",
    },
    {
      header: "Kategori",
      key: "category",
      width: pixel(150),
      renderCell: (row: ItemRow) => (row.category_name ? <Badge variant="neutral" label={row.category_name} /> : "-"),
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(180),
      renderCell: (row: ItemRow) => (
        <HStack gap={2} justify="end">
          <Button size="sm" variant="secondary" label="Harga" onClick={() => setPriceItem(row)} />
          <IconButton size="sm" variant="secondary" label="Edit" icon={<Pencil />} onClick={() => onEdit(row)} />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 />}
            onClick={() => setDeleteTarget({ id: row.item_id, label: row.item_name })}
            isDisabled={row.has_relation}
          />
        </HStack>
      ),
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: items as ItemRow[],
    getRowKey: (item) => item.item_id,
    label: "#",
  });

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={items as ItemRow[]}
        idKey="item_id"
        plugins={{ rowIndex: rowIndexPlugin }}
        emptyState={<EmptyState isCompact title="Belum ada item" />}
      />
      <AlertDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onAction={handleDelete}
        title="Hapus Item"
        description={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak dapat dibatalkan.`}
        actionLabel="Hapus"
        cancelLabel="Batal"
        isActionLoading={deleting}
      />
      <MasterItemPriceDialog isOpen={Boolean(priceItem)} onClose={() => setPriceItem(null)} item={priceItem} />
    </>
  );
}
