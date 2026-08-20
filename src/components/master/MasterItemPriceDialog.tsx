import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, Dialog, HStack, IconButton, Table, Text, VStack } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { useToast } from "@astryxdesign/core/Toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { formatNumber } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { type ItemPriceWithRelation, itemPriceRepo } from "@/db/repositories";
import type { ItemWithDetails } from "@/db/repositories";
import * as v from "valibot";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";

interface PriceRow extends ItemPriceWithRelation, Record<string, unknown> {}

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
  const { createItemPrice, deleteItemPrice } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<ItemPriceWithRelation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [prices, setPrices] = useState<ItemPriceWithRelation[]>([]);

  const form = useForm({
    defaultValues: {
      price: null as unknown as number,
    },
    onSubmit: async ({ value }) => {
      if (!item) return;

      try {
        await createItemPrice({ item_id: item.item_id, price: value.price });

        form.reset();
        await loadPrices();
      } catch (err: any) {
        handleFormError(err, showToast);
      }
    },
    validators: {
      onChange: priceSchema,
    },
  });

  async function loadPrices() {
    if (!item) {
      return;
    }

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
      loadPrices();
    }
  }, [isOpen, item]);

  async function handleDelete() {
    if (!deleteTarget || !item) {
      return;
    }

    setDeleting(true);

    try {
      await deleteItemPrice(deleteTarget.item_price_id, item.item_id);
      setDeleteTarget(null);
      await loadPrices();
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<PriceRow>[] = [
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: proportional(1),
      renderCell: (row: ItemPriceWithRelation) => (
        <HStack gap={2} align="center" justify="end">
          <Text type="code">{formatNumber(row.price)}</Text>
        </HStack>
      ),
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(100),
      renderCell: (row: ItemPriceWithRelation) => {
        const locked = row.has_relation;
        return (
          <HStack justify="end" gap={1}>
            {locked ? (
              <Tooltip content="Harga ini sedang digunakan dan tidak bisa dihapus.">
                <IconButton
                  size="sm"
                  variant="destructive"
                  icon={<Trash2 size={16} />}
                  label="Hapus"
                  onClick={() => setDeleteTarget(row)}
                  isDisabled={true}
                />
              </Tooltip>
            ) : (
              <IconButton
                size="sm"
                variant="destructive"
                icon={<Trash2 size={16} />}
                label="Hapus"
                onClick={() => setDeleteTarget(row)}
                isDisabled={false}
              />
            )}
          </HStack>
        );
      },
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: prices as PriceRow[],
    getRowKey: (item) => item.item_price_id,
    label: "#",
  });

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={560}>
        <VStack gap={4}>
          <PageHeader
            title={`Harga: ${item?.item_name}`}
            actions={<IconButton variant="secondary" icon={<X size={20} />} label="Tutup" onClick={onClose} />}
          />
          <Table
            idKey="item_price_id"
            plugins={{ rowIndex: rowIndexPlugin }}
            textOverflow="truncate"
            columns={columns}
            data={prices as PriceRow[]}
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
                        step={0.01}
                        statusVariant="attached"
                        status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                      />
                    )}
                  />
                </FormLayout>
                <HStack justify="end" gap={2}>
                  <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                    children={([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        variant="primary"
                        label="Tambah"
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
        title="Hapus Harga"
        message={`Hapus harga ${deleteTarget ? formatNumber(deleteTarget.price) : ""}?`}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
      />
    </>
  );
}
