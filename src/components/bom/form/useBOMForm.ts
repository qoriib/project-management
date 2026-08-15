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
  stageId,
  initialData,
  onSuccess,
}: Pick<BOMFormProps, "stageId" | "initialData" | "onSuccess">) {
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const { items } = useMasterStore();
  const { boms: existingBoms, createBOM, updateBOM } = useBOMStore();

  const [priceOptions, setPriceOptions] = useState<{ value: string; label: string }[]>([]);

  const form = useForm({
    defaultValues: buildDefaultValues(initialData),
    validators: { onChange: bomSchema },
    onSubmit: async ({ value }) => {
      try {
        const isReady = selectedProjectId && stageId;

        if (!isReady) return;

        const payload = {
          project_id: selectedProjectId,
          item_id: Number(value.item_id),
          stage_id: stageId,
          qty: value.qty,
          item_price_id: Number(value.item_price_id),
        };

        const isEditMode = initialData !== undefined;

        if (isEditMode) {
          await updateBOM(initialData.bom_id, {
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
    form.setFieldValue("item_id", itemId);
    form.setFieldValue("item_price_id", "");

    const hasItem = itemId.length > 0;
    if (!hasItem) {
      setPriceOptions([]);
      return;
    }

    const opts = await loadAvailablePriceOptions(itemId, initialData);
    setPriceOptions(opts);
  }

  // Sync form ke initialData saat mode edit atau saat stage berubah
  useEffect(() => {
    const isEditMode = initialData !== undefined;

    if (isEditMode) {
      form.reset(buildDefaultValues(initialData));
      loadAvailablePriceOptions(String(initialData.item_id), initialData).then(setPriceOptions);
    } else {
      form.reset(buildDefaultValues());
      setPriceOptions([]);
    }
  }, [initialData, stageId]);

  return {
    form,
    priceOptions,
    items,
    existingBoms,
    selectedProjectId,
    handleItemChange,
  };
}
