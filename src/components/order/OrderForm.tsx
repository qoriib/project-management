import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { AlertDialog, Button, EmptyState, HStack, Table, TextInput, VStack } from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { useToast } from "@astryxdesign/core/Toast";
import { useOrderStore } from "@/store/useOrderStore";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { OrderItemDialog } from "@/components/order/OrderItemDialog";
import { useOrderItemTableState } from "@/components/order/table/useOrderItemTableState";
import { buildDefaultValues, poSchema } from "@/components/order/form/order.schema";
import { getFieldError, handleFormError } from "@/utils/form";
import { generateNextCode, parseDecimalInput } from "@/utils/formatters";
import { type OrderItemRow, useOrderItemFormColumns } from "@/components/order/table/useOrderItemFormColumns";
import type { OrderItemFormValues } from "@/components/order/form/orderItem.schema";
import type { OrderItemDetail, OrderItemInput, OrderWithSummary } from "@/db/repositories";

export interface OrderFormProps {
  order?: OrderWithSummary;
  initialItems?: OrderItemDetail[];
}

export function OrderForm({ order, initialItems = [] }: OrderFormProps) {
  const navigate = useNavigate();
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [items, setItems] = useState<OrderItemDetail[]>(initialItems);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItemDetail | undefined>(undefined);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  const { orders, createOrder, updateOrder } = useOrderStore();

  const nextOrderCode = useMemo(() => {
    if (order) return order.order_code || "";
    return generateNextCode(
      orders.map((o) => o.order_code),
      "PO-",
    );
  }, [orders, order]);

  const form = useForm({
    defaultValues: buildDefaultValues(order, nextOrderCode),
    validators: { onChange: poSchema },
    onSubmit: async ({ value }) => {
      if (!selectedProjectId) return;

      const itemInputs: OrderItemInput[] = items.map((i) => ({
        order_item_id: i.order_item_id.startsWith("draft-") ? undefined : i.order_item_id,
        item_id: i.item_id,
        vendor_id: i.vendor_id,
        item_price_id: i.item_price_id,
        qty: i.qty,
        has_tax: i.has_tax ? 1 : 0,
      }));

      try {
        if (order) {
          await updateOrder(
            order.order_id,
            {
              order_date: value.order_date,
              project_id: selectedProjectId,
              order_code: value.order_code,
            },
            itemInputs,
          );
        } else {
          await createOrder(
            {
              order_date: value.order_date,
              project_id: selectedProjectId,
              order_code: value.order_code,
            },
            itemInputs,
          );
        }
        navigate({ to: "/order" });
      } catch (error: unknown) {
        handleFormError(error, showToast);
      }
    },
  });

  useEffect(() => {
    form.reset(buildDefaultValues(order, nextOrderCode));
  }, [order, nextOrderCode]);

  function handleOpenAdd() {
    setEditingItem(undefined);
    setIsItemDialogOpen(true);
  }

  function handleOpenEdit(item: OrderItemDetail) {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  }

  function handleSaveItem(payload: OrderItemFormValues) {
    const newDetail = buildOrderItemDetail(payload, editingItem, order?.order_id);
    if (editingItem) {
      setItems((prev) => prev.map((i) => (i.order_item_id === editingItem.order_item_id ? newDetail : i)));
    } else {
      setItems((prev) => [...prev, newDetail]);
    }
  }

  function handleDelete() {
    if (!deletingId) return;
    setItems((prev) => prev.filter((i) => i.order_item_id !== deletingId));
    setDeletingId(null);
  }

  const columns = useOrderItemFormColumns({
    onEdit: handleOpenEdit,
    setDeleteTarget: setDeletingId,
  });

  const { dataWithFooters, footerPlugin } = useOrderItemTableState({
    items: items as OrderItemRow[],
    onAdd: handleOpenAdd,
  });

  const rowIndexPlugin = useTableRowIndex<OrderItemRow>({
    data: items as OrderItemRow[],
    getRowKey: (item) => item.order_item_id,
    label: "#",
  });

  return (
    <>
      <VStack gap={4}>
        <HStack gap={3}>
          <form.Field name="order_code">
            {(field) => (
              <TextInput
                isRequired
                width={240}
                label="Nomor Order"
                statusVariant="tooltip"
                value={field.state.value}
                onChange={(v) => field.handleChange(v ?? "")}
                onBlur={field.handleBlur}
                status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
              />
            )}
          </form.Field>
          <form.Field name="order_date">
            {(field) => (
              <DateInput
                isRequired
                width={240}
                format="system_date"
                label="Tanggal Order"
                statusVariant="tooltip"
                value={field.state.value as DateInputProps["value"]}
                onChange={(v) => field.handleChange(v ?? "")}
                onBlur={field.handleBlur}
                status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
              />
            )}
          </form.Field>
        </HStack>
        <VStack paddingBlock={6}>
          <Table
            hasHover
            idKey="order_item"
            textOverflow="truncate"
            columns={columns}
            data={dataWithFooters}
            plugins={{ footer: footerPlugin, rowIndex: rowIndexPlugin }}
            emptyState={<EmptyState isCompact title="Belum ada item pesanan" />}
          />
        </VStack>
        <HStack justify="end" gap={2} wrap="wrap">
          <Button variant="secondary" type="button" label="Batal" onClick={() => navigate({ to: "/order" })} />
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button
                variant="primary"
                type="button"
                onClick={() => form.handleSubmit()}
                label={order ? "Simpan Perubahan" : "Simpan Pemesanan"}
                isLoading={isSubmitting}
                isDisabled={isItemDialogOpen || !canSubmit}
              />
            )}
          </form.Subscribe>
        </HStack>
      </VStack>
      <AlertDialog
        isOpen={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onAction={handleDelete}
        title="Hapus Item Pesanan"
        description="Hapus item ini dari pesanan? Tindakan ini tidak dapat dibatalkan."
        actionLabel="Hapus"
        cancelLabel="Batal"
      />

      <OrderItemDialog
        isOpen={isItemDialogOpen}
        onClose={() => {
          setIsItemDialogOpen(false);
          setEditingItem(undefined);
        }}
        initialData={editingItem}
        onSubmitItem={handleSaveItem}
      />
    </>
  );
}

export function buildOrderItemDetail(
  payload: OrderItemFormValues,
  editingItem?: OrderItemDetail,
  orderId = "",
): OrderItemDetail {
  const { items: globalItems, itemPricesMap, vendors } = useMasterStore.getState();
  const itemDef = globalItems.find((i) => i.item_id === payload.item_id);
  const priceDef = (itemPricesMap.get(payload.item_id) ?? []).find((p) => p.item_price_id === payload.item_price_id);
  const vendorDef = vendors.find((v) => v.vendor_id === payload.vendor_id);
  const numQty = parseDecimalInput(payload.qty);

  return {
    category_code: itemDef?.category_code ?? "",
    category_prefix: itemDef?.category_prefix ?? "",
    item_code: itemDef?.item_code ?? "",
    item_id: payload.item_id,
    item_name: itemDef?.item_name ?? "",
    item_price_id: payload.item_price_id,
    order_id: orderId,
    order_item_id: editingItem ? editingItem.order_item_id : `draft-${Date.now()}`,
    price: priceDef?.price ?? 0,
    qty: numQty,
    has_tax: payload.has_tax ? 1 : 0,
    remaining: numQty,
    total_delivered: 0,
    unit: itemDef?.unit_name ?? "",
    vendor_id: payload.vendor_id,
    vendor_name: vendorDef?.vendor_name ?? "",
  };
}
