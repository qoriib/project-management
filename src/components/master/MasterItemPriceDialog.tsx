import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, VStack, HStack, Button, Table, Badge, IconButton, Card } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { useToast } from "@astryxdesign/core/Toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { pixel, proportional, type TableColumn } from "@astryxdesign/core/Table";
import { formatRupiah } from "@/utils/formatters";
import { itemPriceRepo, type ItemPriceWithRelation } from "@/db/repositories";
import { EntityCode } from "@/components/shared/EntityCode";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import type { ItemPrice, ItemWithDetails } from "@/db/repositories";
import * as v from "valibot";

type PriceRow = ItemPriceWithRelation & Record<string, unknown>;

const priceSchema = v.object({
  price: v.pipe(v.number("Harga harus berupa angka"), v.minValue(0, "Harga tidak valid.")),
});

interface MasterItemPriceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemWithDetails | null;
}

export function MasterItemPriceDialog({ isOpen, onClose, item }: MasterItemPriceDialogProps) {
  const showToast = useToast();

  const [editTarget, setEditTarget] = useState<ItemPriceWithRelation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemPriceWithRelation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [prices, setPrices] = useState<ItemPriceWithRelation[]>([]);

  const form = useForm({
    defaultValues: {
      price: null as unknown as number,
    },
    validators: {
      onChange: priceSchema,
    },
    onSubmit: async ({ value }) => {
      if (!item) return;

      try {
        if (editTarget) {
          await itemPriceRepo.update(editTarget.item_price_id, { price: value.price });
          showToast({ body: "Harga berhasil diubah.", type: "info" });
        } else {
          await itemPriceRepo.create({ item_id: item.item_id, price: value.price });
          showToast({ body: "Harga berhasil ditambahkan.", type: "info" });
        }

        form.reset();
        setEditTarget(null);
        await loadPrices();
      } catch (err: any) {
        showToast({ body: err.message || "Gagal menyimpan harga.", type: "error" });
      }
    }
  });

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
      form.reset();
      setEditTarget(null);
      loadPrices();
    }
  }, [isOpen, item]);

  function startEdit(price: ItemPriceWithRelation) {
    setEditTarget(price);
    form.setFieldValue("price", price.price);
  }

  function cancelEdit() {
    setEditTarget(null);
    form.reset();
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

  const columns: TableColumn<PriceRow>[] = [
    {
      key: "item_price_id",
      header: "#",
      width: pixel(60),
      renderCell: (row: ItemPrice) => (
        <EntityCode prefix="" id={row.item_price_id} padding={3} />
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
      width: pixel(100),
      renderCell: (row: ItemPriceWithRelation) => {
        const locked = row.has_relation;
        return (
          <HStack justify="end" gap={1}>
            <IconButton size="sm" variant="secondary" icon={<Pencil size={16} />} label="Edit" onClick={() => startEdit(row)} isDisabled={locked} />
            <IconButton size="sm"
              variant="destructive"
              icon={<Trash2 size={16} />} label="Hapus"
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
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={560}>
        <VStack gap={4}>
          <PageHeader
            title={`Harga: ${item?.item_name}`}
            actions={<IconButton variant="secondary" icon={<X size={20} />} label="Tutup" onClick={onClose} />}
          />
          <Table
            columns={columns}
            data={prices as PriceRow[]}
            idKey="item_price_id"
            textOverflow="truncate"
            emptyState={<TableEmptyState message="Belum ada harga. Tambahkan di bawah." />}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <Card padding={4}>
              <VStack gap={3}>
                <FormLayout>
                  <form.Field
                    name="price"
                    children={(field) => (
                      <NumberInput
                        label="Harga (Rp)"
                        placeholder="Contoh: 50000"
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val ?? (null as unknown as number))}
                        onBlur={field.handleBlur}
                        isRequired
                        min={0}
                        statusVariant="attached"
                        status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                      />
                    )}
                  />
                </FormLayout>
                <HStack justify="end" gap={2}>
                  {editTarget && (
                    <Button type="button" variant="secondary" label="Batal" onClick={cancelEdit} />
                  )}
                  <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                    children={([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        variant="primary"
                        label={editTarget ? "Simpan" : "Tambah"}
                        isLoading={isSubmitting}
                        isDisabled={!canSubmit}
                      />
                    )}
                  />
                </HStack>
              </VStack>
            </Card>
          </form>
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
