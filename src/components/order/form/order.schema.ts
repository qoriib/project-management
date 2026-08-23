import * as v from "valibot";
import { todayISO } from "@/utils/formatters";
import type { OrderWithSummary } from "@/db/repositories";

export const poSchema = v.object({
  order_code: v.pipe(v.string(), v.nonEmpty("Nomor Order harus diisi.")),
  order_date: v.pipe(v.string(), v.nonEmpty("Tanggal Order harus diisi.")),
});

export interface OrderFormValues {
  order_code: string;
  order_date: string;
}

export function buildDefaultValues(order?: OrderWithSummary | null, nextOrderCode = ""): OrderFormValues {
  return {
    order_code: order?.order_code ?? nextOrderCode,
    order_date: order?.order_date ?? todayISO(),
  };
}
