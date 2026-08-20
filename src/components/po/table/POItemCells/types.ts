import type { usePOItemForm } from "@/components/po/form/usePOItemForm";

export interface CellFormProps {
  form: ReturnType<typeof usePOItemForm>["form"];
}
