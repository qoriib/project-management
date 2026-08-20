import type { useBOMForm } from "@/components/bom/form/useBOMForm";

export interface BaseCellProps {
  form: ReturnType<typeof useBOMForm>["form"];
}
