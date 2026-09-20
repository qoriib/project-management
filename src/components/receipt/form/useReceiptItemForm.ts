import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { receiptItemSchema, buildDefaultValues } from "./receiptItem.schema";
import { handleFormError } from "@/utils/form";
import { parseDecimalInput } from "@/utils/formatters";
import type { OrderItemDetail, ReceiptItemDetail, ReceiptItemInput } from "@/db/repositories";

export type ReceiptItemInputPayload = ReceiptItemInput;

export interface ReceiptItemFormProps {
  initialData?: ReceiptItemDetail;
  availableOrderItems: OrderItemDetail[];
  onSuccess: () => void;
  onSubmitItem: (item: ReceiptItemInputPayload) => Promise<void> | void;
}

export function useReceiptItemForm({
  initialData,
  availableOrderItems,
  onSuccess,
  onSubmitItem,
}: ReceiptItemFormProps) {
  const showToast = useToast();

  const form = useForm({
    defaultValues: buildDefaultValues(initialData),
    validators: { onChange: receiptItemSchema },
    onSubmit: async ({ value }) => {
      try {
        const payload: ReceiptItemInputPayload = {
          order_item_id: value.order_item_id,
          item_price_id: value.item_price_id,
          qty: parseDecimalInput(value.qty),
          has_tax: Boolean(value.has_tax),
        };

        await onSubmitItem(payload);

        if (!initialData) {
          form.reset(buildDefaultValues(undefined));
        }

        onSuccess();
      } catch (error: unknown) {
        handleFormError(error, showToast);
      }
    },
  });

  function handleOrderItemChange(orderItemId: string) {
    form.setFieldValue("order_item_id", orderItemId);

    if (!orderItemId) return;

    const matched = availableOrderItems.find((item) => item.order_item_id === orderItemId);
    if (matched) {
      if (!initialData) {
        form.setFieldValue("item_price_id", matched.item_price_id);
        form.setFieldValue("has_tax", Boolean(matched.has_tax));
        const defaultQty = (matched.remaining ?? 0) > 0 ? (matched.remaining ?? 0) : matched.qty;
        form.setFieldValue("qty", String(defaultQty).replace(".", ","));
      }
    }
  }

  useEffect(() => {
    form.reset(buildDefaultValues(initialData));
  }, [initialData]);

  return {
    form,
    handleOrderItemChange,
  };
}
