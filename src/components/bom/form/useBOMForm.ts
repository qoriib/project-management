import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useBOMStore } from "@/store/useBOMStore";
import { bomSchema, buildDefaultValues, type BOMFormProps } from "./bom.schema";

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
      return;
    }

    const { itemPricesMap, loadItemPrices } = useMasterStore.getState();
    let prices = itemPricesMap.get(itemId);
    if (!prices) {
      prices = await loadItemPrices(itemId);
    }

    // Automatically select the first available price
    const { boms } = useBOMStore.getState();
    const isEditingThisBom = (bomId: string) => initialData !== undefined && bomId === initialData.bom_id;
    const usedPriceIds = boms
      .filter((b) => b.item_id === itemId && !isEditingThisBom(b.bom_id))
      .map((b) => b.item_price_id);
    const availablePrices = prices.filter(p => !usedPriceIds.includes(p.item_price_id));

    if (availablePrices.length > 0) {
      form.setFieldValue("item_price_id", availablePrices[0].item_price_id, { dontValidate: true });
    } else {
      form.setFieldValue("item_price_id", "", { dontValidate: true });
    }
  }

  // Sync form ke initialData saat mode edit atau saat stage berubah
  useEffect(() => {
    const isEditMode = initialData !== undefined;

    if (isEditMode) {
      form.reset(buildDefaultValues(initialData, defaultGroupId));
      const { loadItemPrices, itemPricesMap } = useMasterStore.getState();
      if (!itemPricesMap.has(String(initialData.item_id))) {
        loadItemPrices(String(initialData.item_id));
      }
    } else {
      form.reset(buildDefaultValues(undefined, defaultGroupId));
    }
  }, [initialData, defaultGroupId]);

  return {
    form,
    items,
    handleItemChange,
  };
}
