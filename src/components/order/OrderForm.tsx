import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button, Card, HStack, VStack, Table } from "@astryxdesign/core";
import { TextInput } from "@astryxdesign/core/TextInput";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { useToast } from "@astryxdesign/core/Toast";
import { getFieldError, handleFormError } from "@/utils/form";
import { generateNextCode, todayISO } from "@/utils/formatters";
import { useOrderStore } from "@/store/useOrderStore";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useMasterStore } from "@/store/useMasterStore";
import { OrderItemDialog } from "@/components/order/OrderItemDialog";
import { OrderItemRow, useOrderItemFormColumns } from "@/components/order/table/useOrderItemFormColumns";
import { useOrderItemTableState } from "@/components/order/table/useOrderItemTableState";
import { poSchema } from "@/components/order/form/order.schema";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
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
    defaultValues: {
      order_code: order?.order_code ?? nextOrderCode,
      order_date: order?.order_date ?? todayISO(),
    },
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
    if (order) {
      form.reset({
        order_code: order.order_code,
        order_date: order.order_date,
      });
    } else {
      form.reset({
        order_code: nextOrderCode,
        order_date: todayISO(),
      });
    }
  }, [order, nextOrderCode]);

  function handleOpenAdd() {
    setEditingItem(undefined);
    setIsItemDialogOpen(true);
  }

  function handleOpenEdit(item: OrderItemDetail) {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  }

  function handleSaveItem(payload: any) {
    const { items: globalItems, itemPricesMap, vendors } = useMasterStore.getState();
    const itemDef = globalItems.find((i) => i.item_id === payload.item_id);
    const priceDef = (itemPricesMap.get(payload.item_id) ?? []).find((p) => p.item_price_id === payload.item_price_id);
    const vendorDef = vendors.find((v) => v.vendor_id === payload.vendor_id);

    const newDetail: OrderItemDetail = {
      category_code: itemDef?.category_code ?? "",
      category_prefix: itemDef?.category_prefix ?? "",
      item_code: itemDef?.item_code ?? "",
      item_id: payload.item_id,
      item_name: itemDef?.item_name ?? "",
      item_price_id: payload.item_price_id,
      order_id: "",
      order_item_id: editingItem ? editingItem.order_item_id : `draft-${Date.now()}`,
      price: priceDef?.price ?? 0,
      qty: payload.qty,
      has_tax: payload.has_tax ? 1 : 0,
      remaining: payload.qty,
      total_delivered: 0,
      unit: itemDef?.unit_name ?? "",
      vendor_id: payload.vendor_id,
      vendor_name: vendorDef?.vendor_name ?? "",
    };

    if (editingItem) {
      setItems(items.map((i) => (i.order_item_id === editingItem.order_item_id ? newDetail : i)));
    } else {
      setItems([...items, newDetail]);
    }
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

  async function handleDelete() {
    if (!deletingId) return;
    setItems(items.filter((i) => i.order_item_id !== deletingId));
    setDeletingId(null);
  }

  return (
    <>
      <VStack gap={6}>
        <HStack gap={4}>
          <VStack gap={1} width={240}>
            <form.Field name="order_code">
              {(field) => (
                <TextInput
                  isRequired
                  label="Nomor Order"
                  statusVariant="tooltip"
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v ?? "")}
                  onBlur={field.handleBlur}
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            </form.Field>
          </VStack>
          <VStack gap={1} width={240}>
            <form.Field name="order_date">
              {(field) => (
                <DateInput
                  isRequired
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
          </VStack>
        </HStack>
        <Card>
          <Table
            hasHover
            textOverflow="truncate"
            columns={columns}
            data={dataWithFooters}
            idKey="order_item_id"
            plugins={{ footer: footerPlugin, rowIndex: rowIndexPlugin }}
            emptyState={<TableEmptyState message="Belum ada item. Klik 'Tambah Item' di bawah." />}
          />
        </Card>
        <HStack justify="end" gap={2}>
          <Button variant="secondary" type="button" label="Batal" onClick={() => navigate({ to: "/order" })} />
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button
                variant="primary"
                type="button"
                onClick={() => form.handleSubmit()}
                label={order ? "Simpan Perubahan" : "Buat Baru"}
                isLoading={isSubmitting}
                isDisabled={isItemDialogOpen || !canSubmit}
              />
            )}
          </form.Subscribe>
        </HStack>
      </VStack>
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Item Order"
        message="Apakah Anda yakin ingin menghapus item ini dari Order?"
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
