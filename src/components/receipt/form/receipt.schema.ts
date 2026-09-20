import * as v from "valibot";
import { todayISO } from "@/utils/formatters";
import type { ReceiptDetail } from "@/store/useReceiptStore";

export const receiptSchema = v.object({
  receipt_code: v.pipe(v.string(), v.nonEmpty("Nomor Penerimaan harus diisi.")),
  receipt_date: v.pipe(v.string(), v.nonEmpty("Tanggal Penerimaan harus diisi.")),
});

export interface ReceiptFormValues {
  receipt_code: string;
  receipt_date: string;
}

export function buildDefaultValues(receipt?: ReceiptDetail | null): ReceiptFormValues {
  return {
    receipt_code: receipt?.receipt_code ?? "",
    receipt_date: receipt?.receipt_date || todayISO(),
  };
}
