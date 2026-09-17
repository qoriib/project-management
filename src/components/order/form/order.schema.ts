import * as v from "valibot";
import type { OrderWithSummary } from "@/db/repositories";

export const poSchema = v.object({
  order_code: v.pipe(v.string(), v.nonEmpty("Nomor Order harus diisi.")),
  order_date: v.pipe(v.string(), v.nonEmpty("Tanggal Order harus diisi.")),
  requirement_group_id: v.optional(v.nullable(v.string())),
});

export interface OrderFormValues {
  order_code: string;
  order_date: string;
  requirement_group_id?: string | null;
}

export function buildDefaultValues(order: OrderWithSummary): OrderFormValues {
  return {
    order_code: order.order_code ?? "",
    order_date: order.order_date ?? "",
    requirement_group_id: order.requirement_group_id ?? null,
  };
}
