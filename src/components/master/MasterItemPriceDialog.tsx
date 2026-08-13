import { useEffect, useState } from "react";
import { Dialog, VStack, HStack, Button, Text, Table, Badge } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { useToast } from "@astryxdesign/core/Toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { proportional } from "@astryxdesign/core/Table";
import { formatRupiah } from "@/utils/formatters";
import { itemPriceRepo, type ItemPriceWithRelation } from "@/db/repositories";
import type { ItemPrice, ItemWithDetails } from "@/db/repositories";

interface MasterItemPriceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemWithDetails | null;
}

export function MasterItemPriceDialog({ isOpen, onClose, item }: MasterItemPriceDialogProps) {
  const showToast = useToast();

  const [priceInput, setPriceInput] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<ItemPriceWithRelation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemPriceWithRelation | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [prices, setPrices] = useState<ItemPriceWithRelation[]>([]);

  async function loadPrices() {
    if (!item) return;
    try {
      const data = await itemPriceRepo.findByItemWithRelation(item.item_id);
      setPrices(data);
    } catch {
      setPrices([]);
    }
  }

  useEffect(() => {
    if (isOpen && item) {
      setPriceInput(null);
      setEditTarget(null);
      loadPrices();
    }
  }, [isOpen, item]);

  function startEdit(price: ItemPriceWithRelation) {
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
        await itemPriceRepo.update(editTarget.item_price_id, { price: priceInput });
        showToast({ body: "Harga berhasil diubah.", type: "info" });
      } else {
        await itemPriceRepo.create({ item_id: item.item_id, price: priceInput });
        showToast({ body: "Harga berhasil ditambahkan.", type: "info" });
      }
      setPriceInput(null);
      setEditTarget(null);
      await loadPrices();
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
      await itemPriceRepo.delete(deleteTarget.item_price_id);
      showToast({ body: "Harga berhasil dihapus.", type: "info" });
      setDeleteTarget(null);
      await loadPrices();
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
      width: proportional(0.5),
      renderCell: (row: ItemPrice) => (
        <Text size="sm" color="secondary">{String(row.item_price_id).padStart(3, "0")}</Text>
      ),
    },
    {
      key: "price",
      header: "Harga (Rp)",
      width: proportional(1),
      renderCell: (row: ItemPriceWithRelation) => (
        <HStack gap={2} align="center">
          <Badge variant="neutral" label={formatRupiah(row.price)} />
          {row.has_relation && <Badge variant="info" label="Digunakan" />}
        </HStack>
      ),
    },
    {
      key: "actions",
      header: "",
      width: proportional(1.5),
      renderCell: (row: ItemPriceWithRelation) => {
        const locked = row.has_relation;
        return (
          <HStack gap={1}>
            <Button size="sm" variant="ghost" label="Edit" onClick={() => startEdit(row)} isDisabled={locked} />
            <Button
              size="sm"
              variant="destructive"
              label="Hapus"
              onClick={() => setDeleteTarget(row)}
              isDisabled={locked}
            />
          </HStack>
        );
      },
    },
  ];

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={520}>
        <VStack gap={4}>
          {/* Inline form for add / edit */}
          <VStack gap={2}>
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
              <HStack gap={2}>
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
