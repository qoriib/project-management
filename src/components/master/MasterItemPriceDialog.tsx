import { useEffect, useState } from "react";
import {
  Dialog, VStack, HStack, Button, Heading, Text, Table, Badge,
} from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { useToast } from "@astryxdesign/core/Toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useMasterStore } from "@/store/useMasterStore";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { formatRupiah } from "@/utils/formatters";
import type { ItemPrice, ItemWithDetails } from "@/db/repositories";

interface MasterItemPriceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemWithDetails | null;
}

export function MasterItemPriceDialog({ isOpen, onClose, item }: MasterItemPriceDialogProps) {
  const { itemPricesMap, loadItemPrices, createItemPrice, updateItemPrice, deleteItemPrice } = useMasterStore();
  const showToast = useToast();

  const [priceInput, setPriceInput] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<ItemPrice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemPrice | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const prices = item ? (itemPricesMap.get(item.item_id) ?? []) : [];

  useEffect(() => {
    if (isOpen && item) {
      loadItemPrices(item.item_id);
      setPriceInput(null);
      setEditTarget(null);
    }
  }, [isOpen, item]);

  function startEdit(price: ItemPrice) {
    setEditTarget(price);
    setPriceInput(price.price);
  }

  function cancelEdit() {
    setEditTarget(null);
    setPriceInput(null);
  }

  async function handleSave() {
    if (!item) return;
    if (priceInput == null || priceInput < 0) {
      showToast({ body: "Harga tidak valid.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      if (editTarget) {
        await updateItemPrice(editTarget.item_price_id, { price: priceInput });
        showToast({ body: "Harga berhasil diubah.", type: "info" });
      } else {
        await createItemPrice({ item_id: item.item_id, price: priceInput });
        showToast({ body: "Harga berhasil ditambahkan.", type: "info" });
      }
      setPriceInput(null);
      setEditTarget(null);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menyimpan harga.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !item) return;
    setDeleting(true);
    try {
      await deleteItemPrice(deleteTarget.item_price_id, item.item_id);
      showToast({ body: "Harga berhasil dihapus.", type: "info" });
      setDeleteTarget(null);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus harga.", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "item_price_id",
      header: "#",
      width: pixel(60),
      renderCell: (row: ItemPrice) => (
        <Text size="sm" color="secondary">{String(row.item_price_id).padStart(3, "0")}</Text>
      ),
    },
    {
      key: "price",
      header: "Harga (Rp)",
      width: proportional(1),
      renderCell: (row: ItemPrice) => (
        <Badge variant="neutral" label={formatRupiah(row.price)} />
      ),
    },
    {
      key: "actions",
      header: "",
      width: pixel(160),
      renderCell: (row: ItemPrice) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => startEdit(row)} />
          <Button
            size="sm"
            variant="destructive"
            label="Hapus"
            onClick={() => setDeleteTarget(row)}
          />
        </HStack>
      ),
    },
  ];

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={520}>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={3}>Variasi Harga</Heading>
            {item && (
              <Text color="secondary" size="sm">
                Item: <strong>{item.item_name}</strong> ({item.unit_name})
              </Text>
            )}
          </VStack>

          {/* Inline form for add / edit */}
          <VStack gap={2} style={{ padding: "var(--spacing-3)", background: "var(--color-surface-raised)", borderRadius: "var(--radius-md)" }}>
            <Text weight="semibold" size="sm">
              {editTarget ? `Edit Harga #${String(editTarget.item_price_id).padStart(3, "0")}` : "Tambah Harga"}
            </Text>
            <HStack gap={3} align="end">
              <div style={{ flex: 1 }}>
                <NumberInput
                  label="Harga (Rp)"
                  placeholder="Contoh: 50000"
                  value={priceInput}
                  onChange={(v) => setPriceInput(v ?? null)}
                  isRequired
                  min={0}
                />
              </div>
              <HStack gap={1} style={{ paddingBottom: "2px" }}>
                <Button
                  variant="primary"
                  label={editTarget ? "Simpan" : "Tambah"}
                  onClick={handleSave}
                  isLoading={saving}
                  isDisabled={priceInput == null}
                />
                {editTarget && (
                  <Button variant="ghost" label="Batal" onClick={cancelEdit} />
                )}
              </HStack>
            </HStack>
          </VStack>

          {/* Price list table */}
          {prices.length > 0 ? (
            <Table
              columns={columns as any}
              data={prices as any}
              idKey="item_price_id"
              textOverflow="truncate"
            />
          ) : (
            <VStack align="center" padding={4}>
              <Text color="secondary" size="sm">Belum ada harga. Tambahkan di atas.</Text>
            </VStack>
          )}

          <HStack justify="end">
            <Button variant="ghost" label="Tutup" onClick={onClose} />
          </HStack>
        </VStack>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Harga"
        message={`Hapus harga ${deleteTarget ? formatRupiah(deleteTarget.price) : ""}? Harga yang masih digunakan di BOM/PO tidak bisa dihapus.`}
        isLoading={deleting}
      />
    </>
  );
}
