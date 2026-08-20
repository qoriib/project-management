import * as v from "valibot";
import { todayISO } from "@/utils/formatters";
import type { POWithSummary } from "@/db/repositories";

export const poSchema = v.object({
  po_code: v.pipe(v.string(), v.nonEmpty("Nomor PO harus diisi.")),
  po_date: v.pipe(v.string(), v.nonEmpty("Tanggal PO harus diisi.")),
});

export interface POFormValues {
  po_code: string;
  po_date: string;
}

export function buildDefaultValues(po?: POWithSummary): POFormValues {
  return {
    po_code: po?.po_code ?? "",
    po_date: po?.po_date ?? todayISO(),
  };
}
