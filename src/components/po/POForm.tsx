import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button, Card, HStack, VStack, Table } from "@astryxdesign/core";
import { TextInput } from "@astryxdesign/core/TextInput";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { useToast } from "@astryxdesign/core/Toast";
import { getFieldError, handleFormError } from "@/utils/form";
import { usePOStore } from "@/store/usePOStore";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useMasterStore } from "@/store/useMasterStore";
import { usePOItemForm } from "./form/usePOItemForm";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { POItemRow, usePOItemFormColumns } from "@/components/po/table/usePOItemFormColumns";
import { usePOItemTableState } from "@/components/po/table/usePOItemTableState";
import { poSchema, buildDefaultValues } from "@/components/po/form/po.schema";
import type { POItemDetail, POItemInput, POWithSummary } from "@/db/repositories";
import type { BOMReportItem } from "@/db/services";

export interface POFormProps {
  po?: POWithSummary;
  initialItems?: POItemDetail[];
  bomData: BOMReportItem[];
}

export function POForm({ po, initialItems = [], bomData }: POFormProps) {
  const navigate = useNavigate();
  const showToast = useToast();

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const masterItems = useMasterStore((s) => s.items);

  const { createPO, updatePO } = usePOStore();
  const [items, setItems] = useState<POItemDetail[]>(initialItems);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<POItemDetail | undefined>();

  const form = useForm({
    defaultValues: buildDefaultValues(po),
    validators: { onChange: poSchema },
    onSubmit: async ({ value }) => {
      if (!selectedProjectId) return;

      const itemInputs: POItemInput[] = items.map((i) => ({
        po_item_id: i.po_item_id.startsWith("draft-") ? undefined : i.po_item_id,
        item_id: i.item_id,
        vendor_id: i.vendor_id,
        item_price_id: i.item_price_id,
        qty: i.qty,
      }));

      try {
        if (po) {
          await updatePO(
            po.po_id,
            { po_date: value.po_date, project_id: selectedProjectId, po_code: value.po_code },
            itemInputs,
          );
        } else {
          await createPO(
            { po_date: value.po_date, project_id: selectedProjectId, po_code: value.po_code },
            itemInputs,
          );
        }

        navigate({ to: `/po` });
      } catch (error: unknown) {
        handleFormError(error, showToast);
      }
    },
  });

  // Table form hooks
  const { form: tableForm, handleItemChange } = usePOItemForm({
    initialData: editingData,
    onSubmitItem: (payload) => {
      const { items: globalItems, itemPricesMap, vendors } = useMasterStore.getState();
      const itemDef = globalItems.find((i) => i.item_id === payload.item_id);
      const prices = itemPricesMap.get(payload.item_id) ?? [];
      const priceDef = prices.find((p) => p.item_price_id === payload.item_price_id);
      const vendorDef = vendors.find((v) => v.vendor_id === payload.vendor_id);

      const newDetail: POItemDetail = {
        category_code: itemDef?.category_code ?? "",
        category_prefix: itemDef?.category_prefix ?? "",
        item_code: itemDef?.item_code ?? "",
        item_id: payload.item_id,
        item_name: itemDef?.item_name ?? "",
        item_price_id: payload.item_price_id,
        po_id: "",
        po_item_id: editingData ? editingData.po_item_id : `draft-${Date.now()}`,
        price: priceDef?.price ?? 0,
        qty: payload.qty,
        remaining: payload.qty,
        total_delivered: 0,
        unit: itemDef?.unit_name ?? "",
        vendor_id: payload.vendor_id,
        vendor_name: vendorDef?.vendor_name ?? "",
      };

      if (editingData) {
        setItems(items.map((i) => (i.po_item_id === editingData.po_item_id ? newDetail : i)));
      } else {
        setItems([...items, newDetail]);
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setEditingData(undefined);
    },
  });

  const columns = usePOItemFormColumns({
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

  const { dataWithFooters, footerPlugin } = usePOItemTableState({
    items: items as POItemRow[],
    editingId,
    setEditingId,
    setEditingData,
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    const newItems = items.filter((i) => i.po_item_id !== deleteTarget);
    setItems(newItems);
    setDeleteTarget(null);
  }

  return (
    <>
      <VStack gap={6}>
        <HStack gap={4} width={480}>
          <VStack gap={1} style={{ flex: 1 }}>
            <form.Field name="po_code">
              {(field) => (
                <TextInput
                  label="Nomor PO"
                  placeholder="Misal: PO/2026/08/001"
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v ?? "")}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            </form.Field>
          </VStack>
          <VStack gap={1} style={{ flex: 1 }}>
            <form.Field name="po_date">
              {(field) => (
                <DateInput
                  label="Tanggal PO"
                  value={field.state.value as DateInputProps["value"]}
                  onChange={(v) => field.handleChange(v ?? "")}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="attached"
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
            idKey="po_item_id"
            plugins={{ footer: footerPlugin }}
            emptyState={<TableEmptyState message="Belum ada item. Klik 'Tambah Kebutuhan'." />}
          />
        </Card>
        <HStack justify="end" gap={2}>
          <Button
            variant="secondary"
            type="button"
            label="Batal"
            onClick={() => {
              navigate({ to: "/po" });
            }}
          />
          <form.Subscribe selector={(s) => s.canSubmit}>
            {(canSubmit) => (
              <Button
                variant="primary"
                type="button"
                onClick={() => form.handleSubmit()}
                label={po ? "Simpan Perubahan" : "Buat Baru"}
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
        title="Hapus Item PO"
        message="Apakah Anda yakin ingin menghapus item ini dari Purchase Order?"
      />
      <MasterVendorForm
        isOpen={isVendorFormOpen}
        onClose={() => setIsVendorFormOpen(false)}
        initialData={null}
      />
      <MasterItemPriceDialog
        isOpen={isPriceFormOpen}
        onClose={() => setIsPriceFormOpen(false)}
        item={masterItems.find((i) => i.item_id === tableForm.getFieldValue("item_id")) ?? null}
      />
    </>
  );
}
