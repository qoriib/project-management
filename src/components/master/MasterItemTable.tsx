import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, Table, Badge, HStack, IconButton, Button } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import type { ItemWithDetails } from "@/db/repositories";

interface MasterItemTableProps {
  onEdit: (item: ItemWithDetails) => void;
}

type ItemRow = ItemWithDetails & Record<string, unknown>;

export function MasterItemTable({ onEdit }: MasterItemTableProps) {
  const showToast = useToast();

  const { items, deleteItem } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [priceItem, setPriceItem] = useState<ItemWithDetails | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteItem(deleteTarget.id);
      showToast({ body: "Item berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus item", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<ItemRow>[] = [
    {
      key: "item_id",
      header: "Kode",
      width: pixel(100),
      renderCell: (row: ItemRow) => `BRG-${String(row.item_id).padStart(4, '0')}`
    },
    {
      key: "item_name",
      header: "Nama Item",
      width: proportional(1)
    },
    {
      key: "unit",
      header: "Satuan",
      width: pixel(120),
      renderCell: (row: ItemRow) => row.unit_name
    },
    {
      key: "category",
      header: "Kategori",
      width: pixel(150),
      renderCell: (row: ItemRow) => <Badge variant="neutral" label={row.category_name || "—"} />
    },
    {
      key: "actions",
      header: "",
      width: pixel(180),
      renderCell: (row: ItemRow) => (
        <HStack gap={2} justify="end">
          <Button
            size="sm"
            variant="secondary"
            label="Harga"
            onClick={() => setPriceItem(row)}
          />
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
    },
  ];

  return (
    <>
      <Card>
        <Table
          textOverflow="truncate"
          columns={columns}
          data={items as ItemRow[]}
          idKey="item_id"
          emptyState={<TableEmptyState message="Belum ada item." />}
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
      <MasterItemPriceDialog
        isOpen={!!priceItem}
        onClose={() => setPriceItem(null)}
        item={priceItem}
      />
    </>
  );
}
