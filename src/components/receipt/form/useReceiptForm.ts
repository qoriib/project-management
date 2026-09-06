import { useEffect, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { handleFormError } from "@/utils/form";
import { generateNextCode } from "@/utils/formatters";
import { buildReceiptItemPayload, loadReceiptEditData, loadOrderItemsAsReceiptRows } from "./receipt.utils";
import { type ReceiptFormProps, buildDefaultValues, receiptSchema } from "./receipt.schema";

/**
 * Custom hook yang mengorkestrasikan seluruh logic form Receipt:
 * - Inisialisasi & load data (create / edit)
 * - Auto-generate receipt_code saat buka form baru (5 digit)
 * - Load items saat Order berubah
 * - Submit handler (create / update)
 */
export function useReceiptForm({
  initialPoId,
  initialEditId,
  onSuccess,
}: Pick<ReceiptFormProps, "initialPoId" | "initialEditId" | "onSuccess">) {
  const showToast = useToast();
  const isEdit = Boolean(initialEditId);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { orders, loadAllOrders } = useOrderStore();
  const { receipts, loadAllReceipts, createReceipt, updateReceipt } = useReceiptStore();

  const nextReceiptCode = useMemo(() => {
    return generateNextCode(
      receipts.map((r) => r.receipt_code),
      "NP-",
    );
  }, [receipts]);

  const form = useForm({
    defaultValues: buildDefaultValues(null, nextReceiptCode, initialPoId),
    validators: { onChange: receiptSchema },
    onSubmit: async ({ value }) => {
      try {
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
      } catch (error: unknown) {
        handleFormError(error, showToast);
      }
    },
  });

  /** Load items ke form saat user memilih Order baru (mode create) */
  async function handlePOChange(poId: string) {
    try {
      form.setFieldValue("order_id", poId);

      const hasSelectedPO = poId.length > 0;

      if (hasSelectedPO) {
        const rows = await loadOrderItemsAsReceiptRows(poId);
        form.setFieldValue("items", rows);
      } else {
        form.setFieldValue("items", []);
      }
    } catch (error: unknown) {
      handleFormError(error, showToast);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const projectId = selectedProjectId ?? undefined;
        await Promise.all([loadAllOrders(projectId), loadAllReceipts(projectId)]);

        const hasEditId = isEdit && initialEditId !== undefined;

        if (hasEditId) {
          const editData = await loadReceiptEditData(initialEditId!);

          if (editData !== null) {
            form.reset(buildDefaultValues(editData, nextReceiptCode));
          }
        } else {
          if (!form.getFieldValue("receipt_code")) {
            form.setFieldValue("receipt_code", nextReceiptCode);
          }
          if (initialPoId) {
            const rows = await loadOrderItemsAsReceiptRows(initialPoId);
            form.setFieldValue("items", rows);
          }
        }
      } catch (error: unknown) {
        handleFormError(error, showToast);
      }
    }

    loadData();
  }, [initialPoId, initialEditId, isEdit, selectedProjectId, nextReceiptCode]);

  return { form, handlePOChange, isEdit, orders };
}
