import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@astryxdesign/core/Toast";
import { handleFormError } from "@/utils/form";
import { todayISO } from "@/utils/formatters";
import { useReceiptStore } from "@/store/useReceiptStore";

/**
 * Load dan orkestrasikan data form Penerimaan (header + items) menggunakan Zustand store utama.
 */
export function useReceiptForm(receiptId: string) {
  const showToast = useToast();
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  const { currentReceipt, currentItems: items, loadReceiptDetail, clearReceiptDetail } = useReceiptStore();

  const [receiptCode, setReceiptCode] = useState("");
  const [receiptDate, setReceiptDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await loadReceiptDetail(receiptId);
    } catch (error: unknown) {
      handleFormError(error, toastRef.current);
    } finally {
      setLoading(false);
    }
  }, [receiptId, loadReceiptDetail]);

  useEffect(() => {
    loadData();
    return () => {
      clearReceiptDetail();
    };
  }, [loadData, clearReceiptDetail]);

  useEffect(() => {
    if (currentReceipt) {
      setReceiptCode(currentReceipt.receipt_code);
      setReceiptDate(currentReceipt.receipt_date || todayISO());
    }
  }, [currentReceipt]);

  return {
    orderCode: currentReceipt?.order_code ?? "",
    orderId: currentReceipt?.order_id ?? "",
    receiptCode,
    setReceiptCode,
    receiptDate,
    setReceiptDate,
    items,
    loading,
  };
}
