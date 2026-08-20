import * as v from "valibot";
import { todayISO } from "@/utils/formatters";
import type { OrderWithSummary } from "@/db/repositories";

export const poSchema = v.object({
  order_code: v.pipe(v.string(), v.nonEmpty("Nomor Order harus diisi.")),
  order_date: v.pipe(v.string(), v.nonEmpty("Tanggal Order harus diisi.")),
  has_tax: v.boolean(),
});

export interface OrderFormValues {
  order_code: string;
  order_date: string;
  has_tax: boolean;
}

export function buildDefaultValues(order?: OrderWithSummary): OrderFormValues {
  return {
    order_code: order?.order_code ?? "",
    order_date: order?.order_date ?? todayISO(),
    has_tax: Boolean(order?.has_tax),
  };
}
