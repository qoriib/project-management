import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useBOMStore } from "@/store/useBOMStore";
import { handleFormError } from "@/utils/form";
import { type BOMFormProps, bomSchema, buildDefaultValues } from "./bom.schema";

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
  const { items } = useMasterStore();
  const { createBOM, updateBOM } = useBOMStore();

  const form = useForm({
    defaultValues: buildDefaultValues(initialData, defaultGroupId),
    validators: { onChange: bomSchema },
    onSubmit: async ({ value }) => {
      try {
        if (!selectedProjectId) return;

        const payload = {
          project_id: selectedProjectId,
          bom_group_id: value.bom_group_id,
          item_id: value.item_id,
          qty: value.qty,
          item_price_id: value.item_price_id,
        };

        if (initialData) {
          await updateBOM(initialData.bom_id, payload);
        } else {
          await createBOM(payload);
          form.reset();
        }

        onSuccess();
      } catch (error: any) {
        handleFormError(error, showToast);
      }
    },
  });

  /** Muat & set price options untuk item_id yang diberikan */
  async function handleItemChange(itemId: string) {
    form.setFieldValue("item_id", itemId, { dontValidate: true });

    if (!itemId) return;

    const { itemPricesMap, loadItemPrices } = useMasterStore.getState();

    if (!itemPricesMap.has(itemId)) {
      await loadItemPrices(itemId);
    }

    // Selalu kosongkan harga agar user memilih secara manual
    form.setFieldValue("item_price_id", "", { dontValidate: true });
  }

  // Sync form ke initialData saat mode edit atau saat stage berubah
  useEffect(() => {
    form.reset(buildDefaultValues(initialData, defaultGroupId));

    if (initialData?.item_id) {
      const { loadItemPrices, itemPricesMap } = useMasterStore.getState();
      const itemIdStr = initialData.item_id;

      if (!itemPricesMap.has(itemIdStr)) {
        loadItemPrices(itemIdStr);
      }
    }
  }, [initialData, defaultGroupId]);

  return {
    form,
    handleItemChange,
    items,
  };
}
