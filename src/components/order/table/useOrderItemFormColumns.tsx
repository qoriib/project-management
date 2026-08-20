import { Check, Pencil, Trash2, X } from "lucide-react";
import { Badge, HStack, IconButton, Switch, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import {
  ItemSelectorCell,
  PriceSelectorCell,
  QtyInputCell,
  VendorSelectorCell,
  SubtotalCell,
  UnitDisplayCell,
  ItemCodeDisplayCell,
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
      header: "Kode Item",
      key: "item_code_full",
      width: pixel(160),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) return <ItemCodeDisplayCell form={form} />;

        const code = formatItemCode(row);
        return code ? <EntityCode id={code} /> : "-";
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(2),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) {
          return <ItemSelectorCell form={form} onChangeItem={handleItemChange as (itemId: string) => Promise<void>} />;
        }

        return <Text weight="medium">{row.item_name}</Text>;
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
      width: pixel(260),
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
      align: "center",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(100),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) {
          return (
            <form.Field name="has_tax">
              {(field) => (
                <Switch
                  label="PPn"
                  isLabelHidden
                  value={field.state.value}
                  onChange={(checked) => field.handleChange(checked)}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>
          );
        }

        return row.has_tax ? (
          <Badge label="12%" variant="blue" />
        ) : (
          <Text size="sm" color="secondary">
            -
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total",
      width: pixel(180),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) {
          return (
            <form.Subscribe
              selector={(s) => ({
                itemId: s.values.item_id,
                priceId: s.values.item_price_id,
                qty: s.values.qty,
                hasTax: s.values.has_tax,
              })}
            >
              {({ qty, priceId, itemId, hasTax }) => {
                let priceNum = 0;
                if (itemId && priceId) {
                  const prices = useMasterStore.getState().itemPricesMap.get(itemId) ?? [];
                  const priceObj = prices.find((p) => String(p.item_price_id) === String(priceId));
                  if (priceObj) {
                    priceNum = priceObj.price;
                  }
                }
                const sub = (qty || 0) * priceNum;
                const total = hasTax ? sub * 1.12 : sub;
                return (
                  <Text type="code" weight="bold">
                    {formatNumber(total)}
                  </Text>
                );
              }}
            </form.Subscribe>
          );
        }

        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        const total = row.has_tax ? subtotal * 1.12 : subtotal;
        return (
          <Text type="code" weight="bold">
            {formatNumber(total)}
          </Text>
        );
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
