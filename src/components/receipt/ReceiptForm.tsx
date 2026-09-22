import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertDialog,
  Button,
  EmptyState,
  Heading,
  HStack,
  IconButton,
  Table,
  Text,
  TextInput,
  VStack,
} from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { Card, Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { useTableStickyColumns } from "@astryxdesign/core/Table";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { useToast } from "@astryxdesign/core/Toast";
import { useReceiptStore, type ReceiptDetail } from "@/store/useReceiptStore";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptItemDialog } from "@/components/receipt/ReceiptItemDialog";
import { buildDefaultValues, receiptSchema } from "@/components/receipt/form/receipt.schema";
import { getFieldError, handleFormError } from "@/utils/form";
import { formatNumber } from "@/utils/formatters";
import { calcGrandTotal } from "@/utils/calc";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import { type ReceiptItemRow, useReceiptItemFormColumns } from "@/components/receipt/table/useReceiptItemFormColumns";
import type { ReceiptItemInputPayload } from "@/components/receipt/form/useReceiptItemForm";
import { ArrowLeft } from "lucide-react";
import type { ReceiptItemDetail } from "@/db/repositories";

export interface ReceiptFormProps {
  receipt: ReceiptDetail;
}

export function ReceiptForm({ receipt }: ReceiptFormProps) {
  const navigate = useNavigate();
  const showToast = useToast();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ReceiptItemDetail | undefined>(undefined);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  const {
    currentItems: items,
    availableOrderItems,
    addReceiptItem,
    updateReceiptItem,
    deleteReceiptItem,
    updateReceiptHeader,
  } = useReceiptStore();

  const grandTotal = useMemo(() => calcGrandTotal(items), [items]);

  const form = useForm({
    defaultValues: buildDefaultValues(receipt),
    validators: { onChange: receiptSchema },
  });

  useEffect(() => {
    form.reset(buildDefaultValues(receipt));
  }, [receipt, form]);

  function handleOpenAdd() {
    setEditingItem(undefined);
    setIsItemDialogOpen(true);
  }

  function handleOpenEdit(item: ReceiptItemDetail) {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  }

  useKeyboardShortcut({
    key: "n",
    ctrl: true,
    handler: handleOpenAdd,
  });

  async function handleSaveItem(payload: ReceiptItemInputPayload) {
    try {
      if (editingItem) {
        await updateReceiptItem(receipt.receipt_id, editingItem.receipt_item_id, payload);
        showToast({ body: "Item berhasil diperbarui", type: "info" });
      } else {
        await addReceiptItem(receipt.receipt_id, payload);
        showToast({ body: "Item berhasil ditambahkan", type: "info" });
      }
    } catch (error: unknown) {
      handleFormError(error, showToast);
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteReceiptItem(receipt.receipt_id, deletingId);
      showToast({ body: "Item berhasil dihapus", type: "info" });
    } catch (error: unknown) {
      handleFormError(error, showToast);
    } finally {
      setDeletingId(null);
    }
  }

  const columns = useReceiptItemFormColumns({
    onEdit: handleOpenEdit,
    setDeleteTarget: setDeletingId,
  });

  const rowIndexPlugin = useTableRowIndex<ReceiptItemRow>({
    data: items as ReceiptItemRow[],
    getRowKey: (item) => item.receipt_item_id,
  });

  const stickyColumns = useTableStickyColumns<ReceiptItemRow>({
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
              <HStack gap={3} vAlign="center">
                <IconButton
                  variant="ghost"
                  icon={<ArrowLeft />}
                  label="Kembali"
                  tooltip="Kembali"
                  onClick={() =>
                    navigate({
                      to: receipt.order_id ? `/order/${receipt.order_id}` : "/receipt",
                    })
                  }
                />
                <VStack gap={0.5}>
                  <Heading level={3}>Edit Penerimaan</Heading>
                  <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                    Perbarui rincian penerimaan {receipt.receipt_code}
                    {receipt.order_code ? ` (PO: ${receipt.order_code})` : ""}
                  </Text>
                </VStack>
              </HStack>
              <Button
                variant="primary"
                type="button"
                onClick={() =>
                  navigate({
                    to: receipt.order_id ? `/order/${receipt.order_id}` : "/receipt",
                  })
                }
                label="Simpan"
              />
            </HStack>
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={6}>
            <VStack gap={4}>
              <ProjectRequired>
                <VStack gap={4}>
                  <HStack gap={3}>
                    <form.Field name="receipt_code">
                      {(field) => (
                        <TextInput
                          isRequired
                          width={240}
                          label="Nomor NP"
                          statusVariant="tooltip"
                          value={field.state.value}
                          onChange={(val) => field.handleChange(val ?? "")}
                          onBlur={async () => {
                            field.handleBlur();
                            if (receipt && field.state.value && field.state.value !== receipt.receipt_code) {
                              try {
                                await updateReceiptHeader(receipt.receipt_id, { receipt_code: field.state.value });
                              } catch (error: unknown) {
                                handleFormError(error, showToast);
                              }
                            }
                          }}
                          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                        />
                      )}
                    </form.Field>
                    <form.Field name="receipt_date">
                      {(field) => (
                        <DateInput
                          isRequired
                          width={240}
                          format="system_date"
                          label="Tanggal Penerimaan"
                          statusVariant="tooltip"
                          value={field.state.value as DateInputProps["value"]}
                          onChange={async (dateVal) => {
                            const val = dateVal ?? "";
                            field.handleChange(val);
                            if (receipt && val && val !== receipt.receipt_date) {
                              try {
                                await updateReceiptHeader(receipt.receipt_id, { receipt_date: val });
                              } catch (error: unknown) {
                                handleFormError(error, showToast);
                              }
                            }
                          }}
                          onBlur={async () => {
                            field.handleBlur();
                            if (receipt && field.state.value && field.state.value !== receipt.receipt_date) {
                              try {
                                await updateReceiptHeader(receipt.receipt_id, { receipt_date: field.state.value });
                              } catch (error: unknown) {
                                handleFormError(error, showToast);
                              }
                            }
                          }}
                          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                        />
                      )}
                    </form.Field>
                    {receipt.order_code ? (
                      <TextInput
                        isDisabled
                        width={240}
                        label="Nomor Order (PO)"
                        value={receipt.order_code}
                        onChange={() => {}}
                      />
                    ) : null}
                  </HStack>
                  <Card>
                    <Table
                      hasHover
                      idKey="receipt_item_id"
                      textOverflow="truncate"
                      columns={columns}
                      data={items as ReceiptItemRow[]}
                      plugins={{ rowIndex: rowIndexPlugin, stickyColumns }}
                      emptyState={<EmptyState isCompact title="Belum ada item penerimaan" />}
                    />
                  </Card>
                </VStack>
              </ProjectRequired>
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider padding={6}>
            <HStack gap={4} vAlign="center" hAlign="between">
              <Button
                variant="secondary"
                label="Tambah Item"
                onClick={handleOpenAdd}
                isDisabled={availableOrderItems.length === 0}
              />
              <HStack gap={2} vAlign="center">
                <Text weight="medium" size="base" color="secondary">
                  Total:
                </Text>
                <Text type="code" weight="bold" size="lg" color="primary">
                  Rp {formatNumber(grandTotal, "currency")}
                </Text>
              </HStack>
            </HStack>
          </LayoutFooter>
        }
      />
      <AlertDialog
        isOpen={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onAction={handleDelete}
        title="Hapus Item Penerimaan"
        description="Hapus item ini dari penerimaan? Tindakan ini tidak dapat dibatalkan."
        actionLabel="Hapus"
        cancelLabel="Batal"
      />
      <ReceiptItemDialog
        isOpen={isItemDialogOpen}
        onClose={() => {
          setIsItemDialogOpen(false);
          setEditingItem(undefined);
        }}
        initialData={editingItem}
        availableOrderItems={availableOrderItems}
        onSubmitItem={handleSaveItem}
      />
    </>
  );
}
