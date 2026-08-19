import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  HStack,
  IconButton,
  Table,
  Text,
  VStack,
} from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { useToast } from "@astryxdesign/core/Toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { formatNumber } from "@/utils/formatters";
import { type ItemPriceWithRelation, itemPriceRepo } from "@/db/repositories";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import type { ItemWithDetails } from "@/db/repositories";
import * as v from "valibot";

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
  const showToast = useToast(),
    { createItemPrice, deleteItemPrice } = useMasterStore(),
    [deleteTarget, setDeleteTarget] = useState<ItemPriceWithRelation | null>(null),
    [deleting, setDeleting] = useState(false),
    [prices, setPrices] = useState<ItemPriceWithRelation[]>([]),
    form = useForm({
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
      renderCell: (row: ItemPriceWithRelation) => (
        <HStack gap={2} align="center" justify="end">
          <Text type="code">{formatNumber(row.price)}</Text>
          {row.has_relation && <Badge variant="info" label="Digunakan" />}
        </HStack>
      ),
      width: proportional(1),
    },
    {
      header: "",
      key: "actions",
      renderCell: (row: ItemPriceWithRelation) => {
        const locked = row.has_relation;
        return (
          <HStack justify="end" gap={1}>
            <IconButton
              size="sm"
              variant="destructive"
              icon={<Trash2 size={16} />}
              label="Hapus"
              onClick={() => setDeleteTarget(row)}
              isDisabled={locked}
            />
          </HStack>
        );
      },
      width: pixel(100),
    },
  ];

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={560}>
        <VStack gap={4}>
          <PageHeader
            title={`Harga: ${item?.item_name}`}
            actions={
              <IconButton
                variant="secondary"
                icon={<X size={20} />}
                label="Tutup"
                onClick={onClose}
              />
            }
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
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Harga"
        message={`Hapus harga ${deleteTarget ? formatNumber(deleteTarget.price) : ""}? Harga yang masih digunakan di BOM/PO tidak bisa dihapus.`}
        isLoading={deleting}
      />
    </>
  );
}
