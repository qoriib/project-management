import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@astryxdesign/core/Toast";
import { handleFormError } from "@/utils/form";
import { todayISO } from "@/utils/formatters";
import { loadReceiptEditData } from "./receipt.utils";
import type { ReceiptItemRow } from "./receipt.schema";

/**
 * Load dan orkestrasikan data form Penerimaan (header + items).
 */
export function useReceiptForm(receiptId: string) {
  const showToast = useToast();
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  const [orderCode, setOrderCode] = useState("");
  const [orderId, setOrderId] = useState("");
  const [receiptCode, setReceiptCode] = useState("");
  const [receiptDate, setReceiptDate] = useState(todayISO());
  const [items, setItems] = useState<ReceiptItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadReceiptEditData(receiptId);
      if (data) {
        setItems(data.items);
        setOrderId(data.order_id);
        if (data.order_code) setOrderCode(data.order_code);
        if (data.receipt_code) setReceiptCode(data.receipt_code);
        if (data.receipt_date) setReceiptDate(data.receipt_date);
      }
    } catch (error: unknown) {
      handleFormError(error, toastRef.current);
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { orderCode, orderId, receiptCode, setReceiptCode, receiptDate, setReceiptDate, items, loading };
}
