import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { handleFormError } from "@/utils/form";
import { loadReceiptEditData } from "./receipt.utils";
import { type ReceiptFormProps, buildDefaultValues, receiptSchema } from "./receipt.schema";

/**
 * Custom hook yang mengorkestrasikan data form Receipt:
 * - Load data penerimaan dan kode PO terkait
 */
export function useReceiptForm({ receiptId }: Pick<ReceiptFormProps, "receiptId">) {
  const showToast = useToast();
  const [orderCode, setOrderCode] = useState<string>("");

  const form = useForm({
    defaultValues: buildDefaultValues(null),
    validators: { onChange: receiptSchema },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const editData = await loadReceiptEditData(receiptId);
        if (editData !== null) {
          form.reset(buildDefaultValues(editData));
          if (editData.order_code) {
            setOrderCode(editData.order_code);
          }
        }
      } catch (error: unknown) {
        handleFormError(error, showToast);
      }
    }

    loadData();
  }, [receiptId, showToast, form]);

  return { form, orderCode };
}
