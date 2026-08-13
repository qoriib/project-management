import { useState } from "react";
import { Card, Button, Table, Badge, HStack, Text, VStack } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { useToast } from "@astryxdesign/core/Toast";
import type { ItemWithDetails } from "@/db/repositories";
import { useMasterStore } from "@/store/useMasterStore";

interface MasterItemTableProps {
  onEdit: (item: ItemWithDetails) => void;
}

export function MasterItemTable({ onEdit }: MasterItemTableProps) {
  const { items, deleteItem } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [priceItem, setPriceItem] = useState<ItemWithDetails | null>(null);
  const showToast = useToast();

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

  const columns = [
    {
      key: "item_id",
      header: "Kode",
      width: pixel(120),
      renderCell: (row: ItemWithDetails) => String(row.item_id).padStart(4, '0')
    },
    { key: "item_name", header: "Nama Item", width: proportional(1.5) },
    { key: "unit", header: "Satuan", width: pixel(100), renderCell: (row: ItemWithDetails) => row.unit_name },
    {
      key: "category", header: "Kategori", width: pixel(180),
      renderCell: (row: ItemWithDetails) => <Badge variant="neutral" label={row.category_name || "—"} />,
    },
    {
      key: "actions", header: "", width: pixel(300),
      renderCell: (row: ItemWithDetails) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Kelola Harga" onClick={() => setPriceItem(row)} />
          <Button size="sm" variant="ghost" label="Edit" onClick={() => onEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget({ id: row.item_id, label: row.item_name })} />
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
          data={items as any}
          idKey="item_id"
          emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada item.</Text></VStack>}
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
