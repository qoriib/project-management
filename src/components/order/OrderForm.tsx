import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button, Card, HStack, VStack, Table } from "@astryxdesign/core";
import { TextInput } from "@astryxdesign/core/TextInput";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { useToast } from "@astryxdesign/core/Toast";
import { getFieldError, handleFormError } from "@/utils/form";
import { useOrderStore } from "@/store/useOrderStore";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useMasterStore } from "@/store/useMasterStore";
import { useOrderItemForm } from "./form/useOrderItemForm";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { OrderItemRow, useOrderItemFormColumns } from "@/components/order/table/useOrderItemFormColumns";
import { useOrderItemTableState } from "@/components/order/table/useOrderItemTableState";
import { useTableRowIndex } from "@astryxdesign/core/Table";
import { poSchema, buildDefaultValues } from "@/components/order/form/order.schema";
import type { OrderItemDetail, OrderItemInput, OrderWithSummary } from "@/db/repositories";
import type { RequirementReportItem } from "@/db/services";

export interface OrderFormProps {
  order?: OrderWithSummary;
  initialItems?: OrderItemDetail[];
  bomData: RequirementReportItem[];
}

export function OrderForm({ order, initialItems = [], bomData }: OrderFormProps) {
  const navigate = useNavigate();
  const showToast = useToast();

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const masterItems = useMasterStore((s) => s.items);

  const { createOrder, updateOrder } = useOrderStore();
  const [items, setItems] = useState<OrderItemDetail[]>(initialItems);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<OrderItemDetail | undefined>();

  const form = useForm({
    defaultValues: buildDefaultValues(order),
    validators: { onChange: poSchema },
    onSubmit: async ({ value }) => {
      if (!selectedProjectId) return;

      const itemInputs: OrderItemInput[] = items.map((i) => ({
        order_item_id: i.order_item_id.startsWith("draft-") ? undefined : i.order_item_id,
        item_id: i.item_id,
        vendor_id: i.vendor_id,
        item_price_id: i.item_price_id,
        qty: i.qty,
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

        navigate({ to: `/order` });
      } catch (error: unknown) {
        handleFormError(error, showToast);
      }
    },
  });

  // Table form hooks
  const { form: tableForm, handleItemChange } = useOrderItemForm({
    initialData: editingData,
    onSubmitItem: (payload) => {
      const { items: globalItems, itemPricesMap, vendors } = useMasterStore.getState();
      const itemDef = globalItems.find((i) => i.item_id === payload.item_id);
      const prices = itemPricesMap.get(payload.item_id) ?? [];
      const priceDef = prices.find((p) => p.item_price_id === payload.item_price_id);
      const vendorDef = vendors.find((v) => v.vendor_id === payload.vendor_id);

      const newDetail: OrderItemDetail = {
        category_code: itemDef?.category_code ?? "",
        category_prefix: itemDef?.category_prefix ?? "",
        item_code: itemDef?.item_code ?? "",
        item_id: payload.item_id,
        item_name: itemDef?.item_name ?? "",
        item_price_id: payload.item_price_id,
        order_id: "",
        order_item_id: editingData ? editingData.order_item_id : `draft-${Date.now()}`,
        price: priceDef?.price ?? 0,
        qty: payload.qty,
        remaining: payload.qty,
        total_delivered: 0,
        unit: itemDef?.unit_name ?? "",
        vendor_id: payload.vendor_id,
        vendor_name: vendorDef?.vendor_name ?? "",
      };

      if (editingData) {
        setItems(items.map((i) => (i.order_item_id === editingData.order_item_id ? newDetail : i)));
      } else {
        setItems([...items, newDetail]);
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setEditingData(undefined);
    },
  });

  const columns = useOrderItemFormColumns({
    bomData,
    editingId,
    form: tableForm,
    handleItemChange,
    items,
    setDeleteTarget,
    setEditingData,
    setEditingId,
    setIsPriceFormOpen,
    setIsVendorFormOpen,
  });

  const { dataWithFooters, footerPlugin } = useOrderItemTableState({
    items: items as OrderItemRow[],
    editingId,
    setEditingId,
    setEditingData,
  });

  const rowIndexPlugin = useTableRowIndex<OrderItemRow>({
    data: items as OrderItemRow[],
    getRowKey: (item) => item.order_item_id,
    label: "#",
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    const newItems = items.filter((i) => i.order_item_id !== deleteTarget);
    setItems(newItems);
    setDeleteTarget(null);
  }

  return (
    <>
      <VStack gap={6}>
        <HStack gap={4} width={480}>
          <VStack gap={1} width="50%">
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
          <VStack gap={1} width="50%">
            <form.Field name="order_date">
              {(field) => (
                <DateInput
                  isRequired
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
            emptyState={<TableEmptyState message="Belum ada item. Klik 'Tambah Kebutuhan'." />}
          />
        </Card>
        <HStack justify="end" gap={2}>
          <Button
            variant="secondary"
            type="button"
            label="Batal"
            onClick={() => {
              navigate({ to: "/order" });
            }}
          />
          <form.Subscribe selector={(s) => s.canSubmit}>
            {(canSubmit) => (
              <Button
                variant="primary"
                type="button"
                onClick={() => form.handleSubmit()}
                label={order ? "Simpan Perubahan" : "Buat Baru"}
                isDisabled={!canSubmit}
              />
            )}
          </form.Subscribe>
        </HStack>
      </VStack>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Item Order"
        message="Apakah Anda yakin ingin menghapus item ini dari Purchase Order?"
      />
      <MasterVendorForm isOpen={isVendorFormOpen} onClose={() => setIsVendorFormOpen(false)} initialData={null} />
      <MasterItemPriceDialog
        isOpen={isPriceFormOpen}
        onClose={() => setIsPriceFormOpen(false)}
        item={masterItems.find((i) => i.item_id === tableForm.getFieldValue("item_id")) ?? null}
      />
    </>
  );
}
