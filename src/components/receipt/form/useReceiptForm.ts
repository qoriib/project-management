import { useEffect, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { handleFormError } from "@/utils/form";
import { generateNextCode } from "@/utils/formatters";
import { loadReceiptEditData } from "./receipt.utils";
import { type ReceiptFormProps, buildDefaultValues, receiptSchema } from "./receipt.schema";

/**
 * Custom hook yang mengorkestrasikan data form Receipt:
 * - Load data penerimaan (mode edit)
 * - Sinkronisasi data proyek, order, dan receipt
 */
export function useReceiptForm({
  initialPoId,
  initialEditId,
}: Pick<ReceiptFormProps, "initialPoId" | "initialEditId" | "onSuccess">) {
  const showToast = useToast();
  const isEdit = Boolean(initialEditId);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { orders, loadAllOrders } = useOrderStore();
  const { receipts, loadAllReceipts } = useReceiptStore();

  const nextReceiptCode = useMemo(() => {
    return generateNextCode(
      receipts.map((r) => r.receipt_code),
      "NP-",
    );
  }, [receipts]);

  const form = useForm({
    defaultValues: buildDefaultValues(null, nextReceiptCode, initialPoId),
    validators: { onChange: receiptSchema },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const projectId = selectedProjectId ?? undefined;
        await Promise.all([loadAllOrders(projectId), loadAllReceipts(projectId)]);

        if (initialEditId) {
          const editData = await loadReceiptEditData(initialEditId);
          if (editData !== null) {
            form.reset(buildDefaultValues(editData, nextReceiptCode));
          }
        }
      } catch (error: unknown) {
        handleFormError(error, showToast);
      }
    }

    loadData();
  }, [initialEditId, selectedProjectId, nextReceiptCode, loadAllOrders, loadAllReceipts, showToast, form]);

  return { form, isEdit, orders };
}
