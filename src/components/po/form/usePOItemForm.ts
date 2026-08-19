import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { poItemSchema } from "./poItem.schema";
import type { POItemDetail } from "@/db/repositories";

export interface POItemFormProps {
  initialData?: POItemDetail;
  onSuccess: () => void;
  onSubmitItem: (item: any) => void;
}

export function usePOItemForm({ initialData, onSuccess, onSubmitItem }: POItemFormProps) {
  const showToast = useToast(),
    form = useForm({
      defaultValues: {
        item_id: initialData?.item_id || "",
        item_price_id: initialData?.item_price_id || "",
        qty: initialData?.qty || 0,
        vendor_id: initialData?.vendor_id || "",
      },
      onSubmit: async ({ value }) => {
        try {
          const payload = {
            item_id: value.item_id,
            vendor_id: value.vendor_id,
            item_price_id: value.item_price_id,
            qty: value.qty,
          };

          onSubmitItem(payload);

          if (!initialData) {
            form.reset();
          }

          onSuccess();
        } catch (error: unknown) {
          const isError = error instanceof Error;
          const msg = isError ? error.message : "Terjadi kesalahan";
          showToast({ body: msg, type: "error" });
        }
      },
      validators: { onChange: poItemSchema },
    });

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

    form.setFieldValue("item_price_id", "", { dontValidate: true });
  }

  useEffect(() => {
    const isEditMode = initialData !== undefined;

    if (isEditMode) {
      form.reset({
        item_id: initialData.item_id || "",
        item_price_id: initialData.item_price_id || "",
        qty: initialData.qty || 0,
        vendor_id: initialData.vendor_id || "",
      });
      const { loadItemPrices, itemPricesMap } = useMasterStore.getState();
      if (initialData.item_id && !itemPricesMap.has(initialData.item_id)) {
        loadItemPrices(initialData.item_id);
      }
    } else {
      form.reset({
        item_id: "",
        item_price_id: "",
        qty: 0,
        vendor_id: "",
      });
    }
  }, [initialData]);

  return {
    form,
    handleItemChange,
  };
}
