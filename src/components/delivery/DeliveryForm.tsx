import { HStack, VStack } from "@astryxdesign/core";
import { useDeliveryForm } from "./form/useDeliveryForm";
import { DeliveryHeaderCard } from "./form/DeliveryHeaderCard";
import { DeliveryItemsCard } from "./form/DeliveryItemsCard";
import { DeliveryFormActions } from "./form/DeliveryFormActions";
import type { DeliveryFormProps } from "./form/delivery.schema";

export type { DeliveryFormProps };

/**
 * Entry point form Create / Edit Delivery.
 * Hanya bertanggung jawab mengkomposisikan sub-komponen;
 * seluruh logic ada di `useDeliveryForm`.
 */
export function DeliveryForm({ initialPoId, initialEditId, onSuccess, onCancel }: DeliveryFormProps) {
  const { form, pos, isEdit, handlePOChange } = useDeliveryForm({
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
          <DeliveryHeaderCard form={form} pos={pos} isEdit={isEdit} handlePOChange={handlePOChange} />
        </HStack>
        <DeliveryItemsCard form={form} />
        <DeliveryFormActions form={form as any} onCancel={onCancel} />
      </VStack>
    </form>
  );
}
