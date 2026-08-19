import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, Button, HStack, IconButton, Table, Text } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { EntityCode } from "@/components/shared/EntityCode";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";

import type { ItemWithDetails } from "@/db/repositories";

interface MasterItemTableProps {
  onEdit: (item: ItemWithDetails) => void;
}

interface ItemRow extends ItemWithDetails, Record<string, unknown> {}

export function MasterItemTable({ onEdit }: MasterItemTableProps) {
  const showToast = useToast(),
    { items, deleteItem } = useMasterStore(),
    [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null),
    [deleting, setDeleting] = useState(false),
    [priceItem, setPriceItem] = useState<ItemWithDetails | null>(null);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteItem(deleteTarget.id);
      showToast({ body: "Item berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (error: any) {
      showToast({ body: error.message || "Gagal menghapus item", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<ItemRow>[] = [
    {
      header: "Kode Item",
      key: "item_code",
      renderCell: (row: ItemRow) => {
        const code =
          `${row.category_prefix || ""} ${row.category_code || ""} ${row.item_code || ""}`.trim();
        return code ? <EntityCode prefix="" id={code} /> : "-";
      },
      width: pixel(180),
    },

    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(1),
    },
    {
      header: "Satuan",
      key: "unit",
      renderCell: (row: ItemRow) => row.unit_name,
      width: pixel(120),
    },
    {
      header: "Kategori",
      key: "category",
      renderCell: (row: ItemRow) => <Badge variant="neutral" label={row.category_name || "—"} />,
      width: pixel(150),
    },
    {
      header: "",
      key: "actions",
      renderCell: (row: ItemRow) => (
        <HStack gap={2} justify="end">
          <Button size="sm" variant="secondary" label="Harga" onClick={() => setPriceItem(row)} />
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
            onClick={() => setDeleteTarget({ id: row.item_id, label: row.item_name })}
            isDisabled={row.has_relation}
          />
        </HStack>
      ),
      width: pixel(180),
    },
  ];

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={items as ItemRow[]}
        idKey="item_id"
        emptyState={<TableEmptyState message="Belum ada item." />}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan jika sudah terikat transaksi.`}
        isLoading={deleting}
      />
      <MasterItemPriceDialog
        isOpen={Boolean(priceItem)}
        onClose={() => setPriceItem(null)}
        item={priceItem}
      />
    </>
  );
}
