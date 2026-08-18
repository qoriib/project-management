import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useBOMStore } from "@/store/useBOMStore";
import { bomSchema, buildDefaultValues, type BOMFormProps } from "./bom.schema";
import { loadAvailablePriceOptions } from "./bom.utils";

/**
 * Custom hook yang mengorkestrasikan seluruh logic form BOM:
 * - Inisialisasi & reset form
 * - Load price options saat item berubah
 * - Submit handler (create / update)
 */
export function useBOMForm({
  initialData,
  defaultGroupId,
  onSuccess,
}: Pick<BOMFormProps, "initialData" | "defaultGroupId" | "onSuccess">) {
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const { items, bomGroups } = useMasterStore();
  const { boms: existingBoms, createBOM, updateBOM } = useBOMStore();

  const projectBomGroups = bomGroups.filter(g => g.project_id === selectedProjectId);

  const [priceOptions, setPriceOptions] = useState<{ value: string; label: string }[]>([]);

  const form = useForm({
    defaultValues: buildDefaultValues(initialData, defaultGroupId),
    validators: { onChange: bomSchema },
    onSubmit: async ({ value }) => {
      try {
        const isReady = selectedProjectId;

        if (!isReady) return;

        const payload = {
          project_id: selectedProjectId,
          bom_group_id: value.bom_group_id,
          item_id: value.item_id,
          qty: value.qty,
          item_price_id: value.item_price_id,
        };

        const isEditMode = initialData !== undefined;

        if (isEditMode) {
          await updateBOM(initialData.bom_id, {
            bom_group_id: payload.bom_group_id,
            item_id: payload.item_id,
            qty: payload.qty,
            item_price_id: payload.item_price_id,
          });
        } else {
          await createBOM(payload);
          form.reset();
          setPriceOptions([]);
        }

        onSuccess();
      } catch (error: unknown) {
        const isError = error instanceof Error;
        const msg = isError ? error.message : "Terjadi kesalahan";
        showToast({ body: msg, type: "error" });
      }
    },
  });

  /** Muat & set price options untuk item_id yang diberikan */
  async function handleItemChange(itemId: string) {
    form.setFieldValue("item_id", itemId, { dontValidate: true });

    const hasItem = itemId.length > 0;
    if (!hasItem) {
      setPriceOptions([]);
      return;
    }

    const opts = await loadAvailablePriceOptions(itemId, initialData);

    setPriceOptions(opts);

    if (opts.length > 0) {
      form.setFieldValue("item_price_id", opts[0].value, { dontValidate: true });
    } else {
      form.setFieldValue("item_price_id", "", { dontValidate: true });
    }
  }

  // Sync form ke initialData saat mode edit atau saat stage berubah
  useEffect(() => {
    const isEditMode = initialData !== undefined;

    if (isEditMode) {
      form.reset(buildDefaultValues(initialData, defaultGroupId));
      loadAvailablePriceOptions(String(initialData.item_id), initialData).then(setPriceOptions);
    } else {
      form.reset(buildDefaultValues(undefined, defaultGroupId));
      setPriceOptions([]);
    }
  }, [initialData, defaultGroupId]);

  return {
    form,
    priceOptions,
    items,
    bomGroups: projectBomGroups,
    existingBoms,
    selectedProjectId,
    handleItemChange,
  };
}
