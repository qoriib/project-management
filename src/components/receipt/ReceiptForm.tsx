import { HStack, VStack } from "@astryxdesign/core";
import { useReceiptForm } from "./form/useReceiptForm";
import { ReceiptHeaderCard } from "./form/ReceiptHeaderCard";
import { ReceiptItemsCard } from "./form/ReceiptItemsCard";
import { ReceiptFormActions } from "./form/ReceiptFormActions";
import type { ReceiptFormProps } from "./form/receipt.schema";

export type { ReceiptFormProps };

/**
 * Entry point form Create / Edit Receipt.
 * Hanya bertanggung jawab mengkomposisikan sub-komponen;
 * seluruh logic ada di `useReceiptForm`.
 */
export function ReceiptForm({ initialPoId, initialEditId, onSuccess, onCancel }: ReceiptFormProps) {
  const { form, orders, isEdit, handlePOChange } = useReceiptForm({
    initialEditId,
    initialPoId,
    onSuccess,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <VStack gap={4}>
        <HStack width={720}>
          <ReceiptHeaderCard form={form} orders={orders} isEdit={isEdit} handlePOChange={handlePOChange} />
        </HStack>
        <ReceiptItemsCard form={form} />
        <ReceiptFormActions form={form as any} onCancel={onCancel} />
      </VStack>
    </form>
  );
}
