import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { handleFormError } from "@/utils/form";
import { loadReceiptEditData } from "./receipt.utils";
import { type ReceiptFormProps, type ReceiptItemRow, buildDefaultValues, receiptSchema } from "./receipt.schema";

/**
 * Custom hook yang mengorkestrasikan data form Receipt:
 * - Load data penerimaan, item pesanan (PO) terkait, dan kode PO
 */
export function useReceiptForm({ receiptId }: Pick<ReceiptFormProps, "receiptId">) {
  const showToast = useToast();
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  const [orderCode, setOrderCode] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [items, setItems] = useState<ReceiptItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const form = useForm({
    defaultValues: buildDefaultValues(null),
    validators: { onChange: receiptSchema },
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const editData = await loadReceiptEditData(receiptId);
      if (editData !== null) {
        setItems(editData.items);
        setOrderId(editData.order_id);
        if (editData.order_code) {
          setOrderCode(editData.order_code);
        }
        form.reset(buildDefaultValues(editData));
      }
    } catch (error: unknown) {
      handleFormError(error, toastRef.current);
    } finally {
      setLoading(false);
    }
  }, [receiptId, form]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { form, orderCode, orderId, items, setItems, loading, reloadData: loadData };
}
