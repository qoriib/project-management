import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { orderItemSchema, buildDefaultValues } from "./orderItem.schema";
import { handleFormError } from "@/utils/form";
import { parseDecimalInput } from "@/utils/formatters";
import type { OrderItemDetail, OrderItemInput } from "@/db/repositories";

export type OrderItemInputPayload = Omit<OrderItemInput, "order_item_id">;

export interface OrderItemFormProps {
  initialData?: OrderItemDetail;
  onSuccess: () => void;
  onSubmitItem: (item: OrderItemInputPayload) => Promise<void> | void;
}

export function useOrderItemForm({ initialData, onSuccess, onSubmitItem }: OrderItemFormProps) {
  const showToast = useToast(),
    form = useForm({
      defaultValues: buildDefaultValues(initialData),
      validators: { onChange: orderItemSchema },
      onSubmit: async ({ value }) => {
        try {
          const { itemPricesMap } = useMasterStore.getState();
          const matchedPrice = itemPricesMap.get(value.item_id)?.find((p) => p.item_price_id === value.item_price_id);
          const resolvedPrice = matchedPrice?.price ?? initialData?.price ?? 0;

          const payload: OrderItemInputPayload = {
            item_id: value.item_id,
            vendor_id: value.vendor_id,
            item_price_id: value.item_price_id,
            price: resolvedPrice,
            requirement_group_id: value.requirement_group_id || undefined,
            qty: parseDecimalInput(value.qty),
            has_tax: Boolean(value.has_tax),
          };

          await onSubmitItem(payload);

          if (!initialData) {
            form.reset(buildDefaultValues());
          }

          onSuccess();
        } catch (error: unknown) {
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
