import type { useRequirementForm } from "@/components/requirement/form/useRequirementForm";

export interface BaseCellProps {
  form: ReturnType<typeof useRequirementForm>["form"];
}
