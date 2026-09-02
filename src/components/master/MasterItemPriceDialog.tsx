import { Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  HStack,
  IconButton,
  Table,
  Text,
  TextInput,
  VStack,
} from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { useToast } from "@astryxdesign/core/Toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { formatNumber, sanitizeDecimalInput, parseDecimalInput } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { type TableColumn, pixel, proportional, useTablePagination, paginateData } from "@astryxdesign/core/Table";
import { type ItemPriceWithRelation, itemPriceRepo } from "@/db/repositories";
import type { ItemWithDetails } from "@/db/repositories";
import * as v from "valibot";

interface PriceRow extends ItemPriceWithRelation, Record<string, unknown> {}

const priceSchema = v.object({
  price: v.pipe(
    v.string("Harga harus diisi."),
    v.nonEmpty("Harga harus diisi."),
    v.check((val) => parseDecimalInput(val) > 0, "Harga harus lebih dari 0."),
  ),
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
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const form = useForm({
    defaultValues: {
      price: "",
    },
    validators: {
      onChange: priceSchema,
      onSubmitAsync: async ({ value }) => {
        if (!item) return null;

        const numPrice = parseDecimalInput(value.price);
        if (numPrice <= 0) return null;

        const isDuplicate = prices.some((p) => Math.abs(Number(p.price) - numPrice) < 0.00001);

        if (isDuplicate) {
          return {
            fields: {
              price: "Harga tersebut sudah ada untuk item ini.",
            },
          };
        }

        try {
          await createItemPrice({ item_id: item.item_id, price: numPrice });
          return null;
        } catch (error: any) {
          handleFormError(error, showToast);
          return null;
        }
      },
    },
    onSubmit: async () => {
      form.reset({ price: "" });
      await loadPrices();
    },
  });

  async function loadPrices() {
    if (!item) return;

    try {
      const data = await itemPriceRepo.findByItemWithRelation(item.item_id);
      form.reset({ price: "" });
      setPrices(data);
    } catch {
      setPrices([]);
    }
  }

  useEffect(() => {
    if (isOpen && item) {
      setPage(1);
      form.reset({ price: "" });
      loadPrices();
    }
  }, [isOpen, item]);

  async function handleDelete() {
    if (!deleteTarget || !item) return;

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
                  icon={<Trash2 />}
                  label="Hapus"
                  onClick={() => setDeleteTarget(row)}
                  isDisabled={true}
                />
              </Tooltip>
            ) : (
              <IconButton
                size="sm"
                variant="destructive"
                icon={<Trash2 />}
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

  const paginatedPrices = useMemo(() => {
    return paginateData(prices, page, pageSize);
  }, [prices, page, pageSize]);

  const paginationPlugin = useTablePagination<PriceRow>({
    page,
    onPageChange: setPage,
    totalItems: prices.length,
    pageSize,
    variant: "pages",
    size: "sm",
  });

  const rowIndexPlugin = useTableRowIndex({
    data: paginatedPrices as PriceRow[],
    getRowKey: (item) => item.item_price_id,
    startFrom: (page - 1) * pageSize + 1,
  });

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={560}>
        <VStack gap={4}>
          <PageHeader
            title={item?.item_name ?? ""}
            actions={<IconButton variant="secondary" icon={<X />} label="Tutup" onClick={onClose} />}
          />
          <Table
            idKey="item_price_id"
            plugins={{ rowIndex: rowIndexPlugin, pagination: paginationPlugin }}
            textOverflow="truncate"
            columns={columns}
            data={paginatedPrices as PriceRow[]}
            emptyState={<EmptyState isCompact title="Belum ada riwayat harga" />}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <Card>
              <Layout
                content={
                  <LayoutContent>
                    <FormLayout>
                      <form.Field
                        name="price"
                        children={(field) => (
                          <TextInput
                            label="Harga (Rp)"
                            value={field.state.value}
                            onChange={(val) => field.handleChange(sanitizeDecimalInput(val))}
                            onBlur={field.handleBlur}
                            isRequired
                            statusVariant="tooltip"
                            status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                          />
                        )}
                      />
                    </FormLayout>
                  </LayoutContent>
                }
                footer={
                  <LayoutFooter hasDivider>
                    <HStack justify="end" gap={2} width="100%">
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
                  </LayoutFooter>
                }
              />
            </Card>
          </form>
        </VStack>
      </Dialog>
      <AlertDialog
        title="Hapus Harga"
        description={`Hapus harga ${deleteTarget ? formatNumber(deleteTarget.price) : ""}? Tindakan ini tidak dapat dibatalkan.`}
        actionLabel="Hapus"
        cancelLabel="Batal"
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onAction={handleDelete}
        isActionLoading={deleting}
      />
    </>
  );
}
