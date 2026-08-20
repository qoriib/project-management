import type { useOrderItemForm } from "@/components/order/form/useOrderItemForm";

export interface CellFormProps {
  form: ReturnType<typeof useOrderItemForm>["form"];
}
