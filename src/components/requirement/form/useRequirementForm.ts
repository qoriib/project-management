import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import { handleFormError } from "@/utils/form";
import { parseDecimalInput } from "@/utils/formatters";
import { type RequirementFormProps, requirementSchema, buildDefaultValues } from "./requirement.schema";

/**
 * Custom hook that orchestrates all Requirement form logic:
 * - Form initialization & reset
 * - Load price options when item changes
 * - Submit handler (create / update)
 */
export function useRequirementForm({ initialData, onSuccess }: RequirementFormProps) {
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { items } = useMasterStore();
  const { createRequirement, updateRequirement } = useRequirementStore();

  const form = useForm({
    defaultValues: buildDefaultValues(initialData),
    validators: { onChange: requirementSchema },
    onSubmit: async ({ value }) => {
      try {
        if (!selectedProjectId) return;

        const payload = {
          project_id: selectedProjectId,
          item_id: value.item_id,
          qty: parseDecimalInput(value.qty),
          item_price_id: value.item_price_id,
          has_tax: value.has_tax ? 1 : 0,
        };

        if (initialData) {
          await updateRequirement(initialData.requirement_id, payload);
        } else {
          await createRequirement(payload);
          form.reset();
        }

        onSuccess();
      } catch (error: any) {
        handleFormError(error, showToast);
      }
    },
  });

  /** Load & set price options for the given item_id */
  async function handleItemChange(itemId: string) {
    form.setFieldValue("item_id", itemId, { dontValidate: true });
    form.setFieldValue("item_price_id", "", { dontValidate: true });

    if (!itemId) return;

    const { itemPricesMap, loadItemPrices } = useMasterStore.getState();
    if (!itemPricesMap.has(itemId)) {
      await loadItemPrices(itemId);
    }
  }

  // Sync form when initialData changes (edit mode)
  useEffect(() => {
    form.reset(buildDefaultValues(initialData));

    if (initialData?.item_id) {
      const { loadItemPrices, itemPricesMap } = useMasterStore.getState();
      if (!itemPricesMap.has(initialData.item_id)) {
        loadItemPrices(initialData.item_id);
      }
    }
  }, [initialData]);

  return { form, handleItemChange, items };
}
