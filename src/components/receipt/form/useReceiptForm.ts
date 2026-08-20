import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useAppStore } from "@/store/useAppStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { todayISO } from "@/utils/formatters";
import { buildReceiptItemPayload, loadReceiptEditData, loadOrderItemsAsReceiptRows } from "./receipt.utils";
import { type ReceiptFormProps, type ReceiptItemRow, receiptSchema } from "./receipt.schema";

/**
 * Custom hook yang mengorkestrasikan seluruh logic form Receipt:
 * - Inisialisasi & load data (create / edit)
 * - Load items saat Order berubah
 * - Submit handler (create / update)
 */
export function useReceiptForm({
  initialPoId,
  initialEditId,
  onSuccess,
}: Pick<ReceiptFormProps, "initialPoId" | "initialEditId" | "onSuccess">) {
  const isEdit = Boolean(initialEditId);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { orders, loadAllOrders } = useOrderStore();
  const { createReceipt, updateReceipt } = useReceiptStore();

  const form = useForm({
    defaultValues: {
      receipt_code: "",
      receipt_date: todayISO(),
      items: [] as ReceiptItemRow[],
      order_id: initialPoId ?? "",
    },
    validators: { onChange: receiptSchema },
    onSubmit: async ({ value }) => {
      const payload = buildReceiptItemPayload(value.items);

      const header = {
        order_id: value.order_id,
        receipt_code: value.receipt_code,
        receipt_date: value.receipt_date,
      };

      if (isEdit) {
        await updateReceipt(initialEditId!, header, payload);
      } else {
        await createReceipt(header, payload);
      }

      onSuccess(value.order_id);
    },
  });

  /** Load items ke form saat user memilih Order baru (mode create) */
  async function handlePOChange(poId: string) {
    form.setFieldValue("order_id", poId);

    const hasSelectedPO = poId.length > 0;

    if (hasSelectedPO) {
      const rows = await loadOrderItemsAsReceiptRows(poId);
      form.setFieldValue("items", rows);
    } else {
      form.setFieldValue("items", []);
    }
  }

  useEffect(() => {
    async function loadData() {
      const projectId = selectedProjectId ?? undefined;
      await loadAllOrders(projectId);

      const hasEditId = isEdit && initialEditId !== undefined;

      if (hasEditId) {
        const editData = await loadReceiptEditData(initialEditId!);

        if (editData !== null) {
          form.reset({
            order_id: editData!.order_id,
            receipt_code: editData!.receipt_code,
            receipt_date: editData!.receipt_date,
            items: editData!.items,
          });
        }
      } else if (initialPoId) {
        const rows = await loadOrderItemsAsReceiptRows(initialPoId);
        form.setFieldValue("items", rows);
      }
    }

    loadData();
  }, [initialPoId, initialEditId, isEdit, selectedProjectId]);

  return { form, handlePOChange, isEdit, orders };
}
