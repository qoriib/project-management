import { Check, Pencil, Trash2, X } from "lucide-react";
import { HStack, IconButton, Text, VStack } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import {
  ItemSelectorCell,
  PriceSelectorCell,
  QtyInputCell,
  VendorSelectorCell,
  SubtotalCell,
  ItemCodeDisplayCell,
  UnitDisplayCell,
} from "@/components/order/table/OrderItemCells";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { OrderItemDetail } from "@/db/repositories";
import type { useOrderItemForm } from "@/components/order/form/useOrderItemForm";

export interface OrderItemRow extends OrderItemDetail, Record<string, unknown> {
  isFooter?: boolean;
  isDraft?: boolean;
}

interface UseOrderItemFormColumnsProps {
  editingId: string | null;
  form: ReturnType<typeof useOrderItemForm>["form"];
  items: OrderItemDetail[];
  handleItemChange: (itemId: string) => void | Promise<void>;
  setEditingId: (id: string | null) => void;
  setEditingData: (data: OrderItemDetail | undefined) => void;
  setDeleteTarget: (id: string | null) => void;
  setIsVendorFormOpen: (open: boolean) => void;
  setIsPriceFormOpen: (open: boolean) => void;
}

export function useOrderItemFormColumns({
  editingId,
  form,
  handleItemChange,
  setEditingId,
  setEditingData,
  setDeleteTarget,
  setIsVendorFormOpen,
  setIsPriceFormOpen,
}: UseOrderItemFormColumnsProps) {
  const vendors = useMasterStore((s) => s.vendors);
  const isEditing = (row: OrderItemRow) => row.order_item_id === editingId || (editingId === "new-item" && row.isDraft);

  const columns: TableColumn<OrderItemRow>[] = [
    {
      header: "Item",
      key: "item",
      width: proportional(2),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) {
          return (
            <VStack gap={1} align="start" width="100%">
              <ItemSelectorCell form={form} onChangeItem={handleItemChange as (itemId: string) => Promise<void>} />
              <ItemCodeDisplayCell form={form} />
            </VStack>
          );
        }

        const code = formatItemCode(row);
        return (
          <VStack gap={1} align="start">
            <Text weight="medium">{row.item_name}</Text>
            {code ? (
              <EntityCode id={code} />
            ) : (
              <Text size="sm" color="secondary">
                -
              </Text>
            )}
          </VStack>
        );
      },
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(200),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) return <PriceSelectorCell form={form} onAddNewPrice={() => setIsPriceFormOpen(true)} />;

        return <Text type="code">{formatNumber(row.price)}</Text>;
      },
    },
    {
      header: "Vendor",
      key: "vendor",
      width: pixel(240),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) {
          return <VendorSelectorCell form={form} vendors={vendors} onAddNewVendor={() => setIsVendorFormOpen(true)} />;
        }

        return row.vendor_name ?? "—";
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) return <UnitDisplayCell form={form} />;

        return row.unit ?? "-";
      },
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(130),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) return <QtyInputCell form={form} />;

        return (
          <Text type="code" weight="medium">
            {formatNumber(row.qty, 2)}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) return <SubtotalCell form={form} />;

        return <Text type="code">{formatNumber((row.qty ?? 0) * (row.price ?? 0))}</Text>;
      },
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: proportional(1),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) {
          return (
            <form.Subscribe selector={(s) => ({ isSubmitting: s.isSubmitting, canSubmit: s.canSubmit })}>
              {({ isSubmitting, canSubmit }) => (
                <HStack gap={2} justify="end">
                  <IconButton
                    size="sm"
                    type="button"
                    variant="primary"
                    label="Simpan"
                    icon={<Check size={16} />}
                    isLoading={isSubmitting}
                    isDisabled={!canSubmit}
                    onClick={() => form.handleSubmit()}
                  />
                  <IconButton
                    size="sm"
                    type="button"
                    variant="secondary"
                    label="Batal"
                    icon={<X size={16} />}
                    isDisabled={isSubmitting}
                    onClick={() => {
                      setEditingId(null);
                      setEditingData(undefined);
                      form.reset();
                    }}
                  />
                </HStack>
              )}
            </form.Subscribe>
          );
        }

        return (
          <HStack gap={2} justify="end">
            <IconButton
              size="sm"
              variant="secondary"
              label="Edit"
              icon={<Pencil size={16} />}
              isDisabled={!!editingId}
              onClick={() => {
                setEditingId(row.order_item_id);
                setEditingData(row as OrderItemDetail);
              }}
            />
            <IconButton
              size="sm"
              variant="destructive"
              label="Hapus"
              icon={<Trash2 size={16} />}
              isDisabled={!!editingId}
              onClick={() => setDeleteTarget(row.order_item_id)}
            />
          </HStack>
        );
      },
    },
  ];

  return columns;
}
