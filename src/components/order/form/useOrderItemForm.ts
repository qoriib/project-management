import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { orderItemSchema, buildDefaultValues } from "./orderItem.schema";
import type { OrderItemDetail } from "@/db/repositories";
import { handleFormError } from "@/utils/form";

export interface OrderItemFormProps {
  initialData?: OrderItemDetail;
  onSuccess: () => void;
  onSubmitItem: (item: any) => void;
}

export function useOrderItemForm({ initialData, onSuccess, onSubmitItem }: OrderItemFormProps) {
  const showToast = useToast(),
    form = useForm({
      defaultValues: buildDefaultValues(initialData),
      validators: { onChange: orderItemSchema },
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
        } catch (error: any) {
          handleFormError(error, showToast);
        }
      },
    });

  async function handleItemChange(itemId: string) {
    form.setFieldValue("item_id", itemId, { dontValidate: true });

    if (!itemId) return;

    const { itemPricesMap, loadItemPrices } = useMasterStore.getState();

    if (!itemPricesMap.has(itemId)) {
      await loadItemPrices(itemId);
    }

    form.setFieldValue("item_price_id", "", { dontValidate: true });
  }

  useEffect(() => {
    form.reset(buildDefaultValues(initialData));

    if (initialData?.item_id) {
      const { loadItemPrices, itemPricesMap } = useMasterStore.getState();

      if (!itemPricesMap.has(initialData.item_id)) {
        loadItemPrices(initialData.item_id);
      }
    }
  }, [initialData]);

  return {
    form,
    handleItemChange,
  };
}
