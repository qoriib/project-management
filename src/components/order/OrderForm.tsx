import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { AlertDialog, Button, EmptyState, Heading, HStack, Table, Text, TextInput, VStack } from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { Card, Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { useTableStickyColumns } from "@astryxdesign/core/Table";
import { useToast } from "@astryxdesign/core/Toast";
import { useOrderStore } from "@/store/useOrderStore";
import { useAppStore } from "@/store/useAppStore";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderItemDialog } from "@/components/order/OrderItemDialog";
import { buildDefaultValues, poSchema } from "@/components/order/form/order.schema";
import { getFieldError, handleFormError } from "@/utils/form";
import { generateNextCode, formatNumber, parseDecimalInput } from "@/utils/formatters";
import { calcGrandTotal } from "@/utils/calc";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import { type OrderItemRow, useOrderItemFormColumns } from "@/components/order/table/useOrderItemFormColumns";
import type { OrderItemFormValues } from "@/components/order/form/orderItem.schema";
import type { OrderItemDetail, OrderWithSummary } from "@/db/repositories";

export interface OrderFormProps {
  order?: OrderWithSummary;
  initialItems?: OrderItemDetail[];
}

export function OrderForm({ order, initialItems = [] }: OrderFormProps) {
  const navigate = useNavigate();
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItemDetail | undefined>(undefined);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  const { orders, currentItems, addOrderItem, updateOrderItem, deleteOrderItem, updateOrderHeader } = useOrderStore();
  const items = order ? currentItems : initialItems;

  const nextOrderCode = useMemo(() => {
    if (order) return order.order_code || "";
    return generateNextCode(
      orders.map((o) => o.order_code),
      "PO-",
    );
  }, [orders, order]);

  const grandTotal = useMemo(() => calcGrandTotal(items), [items]);

  const form = useForm({
    defaultValues: buildDefaultValues(order, nextOrderCode),
    validators: { onChange: poSchema },
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

  useKeyboardShortcut({
    key: "n",
    ctrl: true,
    handler: handleOpenAdd,
    enabled: Boolean(selectedProjectId),
  });

  async function handleSaveItem(payload: OrderItemFormValues) {
    if (!order) return;
    const itemInput = {
      item_id: payload.item_id,
      vendor_id: payload.vendor_id,
      item_price_id: payload.item_price_id,
      qty: parseDecimalInput(payload.qty),
      has_tax: payload.has_tax,
    };

    try {
      if (editingItem) {
        await updateOrderItem(order.order_id, editingItem.order_item_id, itemInput);
        showToast({ body: "Item berhasil diperbarui", type: "info" });
      } else {
        await addOrderItem(order.order_id, itemInput);
        showToast({ body: "Item berhasil ditambahkan", type: "info" });
      }
    } catch (error: unknown) {
      handleFormError(error, showToast);
    }
  }

  async function handleDelete() {
    if (!deletingId || !order) return;
    try {
      await deleteOrderItem(order.order_id, deletingId);
      showToast({ body: "Item berhasil dihapus", type: "info" });
    } catch (error: unknown) {
      handleFormError(error, showToast);
    } finally {
      setDeletingId(null);
    }
  }

  const columns = useOrderItemFormColumns({
    onEdit: handleOpenEdit,
    setDeleteTarget: setDeletingId,
  });

  const rowIndexPlugin = useTableRowIndex<OrderItemRow>({
    data: items as OrderItemRow[],
    getRowKey: (item) => item.order_item_id,
  });

  const stickyColumns = useTableStickyColumns<OrderItemRow>({
    startKeys: ["__rowIndex", "item_code", "item_name"],
    endKeys: ["actions"],
  });

  return (
    <>
      <Layout
        height="fill"
        header={
          <LayoutHeader hasDivider padding={6}>
            <HStack gap={2} vAlign="center" hAlign="between">
              <VStack gap={0.5}>
                <Heading level={3}>{order ? "Edit Pengadaan" : "Pengadaan Baru"}</Heading>
                <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                  {order ? `Perbarui rincian pengadaan ${order.order_code}` : "Buat pengadaan pembelian baru"}
                </Text>
              </VStack>
              <Button variant="secondary" type="button" onClick={() => navigate({ to: "/order" })} label="Kembali" />
            </HStack>
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={6}>
            <VStack gap={4}>
              <ProjectRequired>
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
                          onBlur={async () => {
                            field.handleBlur();
                            if (order && field.state.value && field.state.value !== order.order_code) {
                              try {
                                await updateOrderHeader(order.order_id, { order_code: field.state.value });
                              } catch (error: unknown) {
                                handleFormError(error, showToast);
                              }
                            }
                          }}
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
                          onChange={async (v) => {
                            const val = v ?? "";
                            field.handleChange(val);
                            if (order && val && val !== order.order_date) {
                              try {
                                await updateOrderHeader(order.order_id, { order_date: val });
                              } catch (error: unknown) {
                                handleFormError(error, showToast);
                              }
                            }
                          }}
                          onBlur={async () => {
                            field.handleBlur();
                            if (order && field.state.value && field.state.value !== order.order_date) {
                              try {
                                await updateOrderHeader(order.order_id, { order_date: field.state.value });
                              } catch (error: unknown) {
                                handleFormError(error, showToast);
                              }
                            }
                          }}
                          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                        />
                      )}
                    </form.Field>
                  </HStack>
                  <Card>
                    <Table
                      hasHover
                      idKey="order_item_id"
                      textOverflow="truncate"
                      columns={columns}
                      data={items as OrderItemRow[]}
                      plugins={{ rowIndex: rowIndexPlugin, stickyColumns }}
                      emptyState={<EmptyState isCompact title="Belum ada item pesanan" />}
                    />
                  </Card>
                </VStack>
              </ProjectRequired>
            </VStack>
          </LayoutContent>
        }
        footer={
          selectedProjectId ? (
            <LayoutFooter hasDivider padding={6}>
              <HStack gap={4} vAlign="center" hAlign="between">
                <Button variant="secondary" label="Tambah Item" onClick={handleOpenAdd} />
                <HStack gap={2} vAlign="center">
                  <Text weight="medium" size="base" color="secondary">
                    Total:
                  </Text>
                  <Text type="code" weight="bold" size="lg" color="primary">
                    Rp {formatNumber(grandTotal, 2)}
                  </Text>
                </HStack>
              </HStack>
            </LayoutFooter>
          ) : null
        }
      />
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
