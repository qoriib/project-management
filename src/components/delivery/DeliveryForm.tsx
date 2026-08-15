import { VStack, HStack, Button } from "@astryxdesign/core";
import { useDeliveryForm } from "./form/useDeliveryForm";
import { DeliveryHeaderCard } from "./form/DeliveryHeaderCard";
import { DeliveryItemsCard } from "./form/DeliveryItemsCard";
import type { DeliveryFormProps } from "./form/delivery.schema";
export type { DeliveryFormProps };

/**
 * Entry point form Create / Edit Delivery.
 * Hanya bertanggung jawab mengkomposisikan sub-komponen;
 * seluruh logic ada di `useDeliveryForm`.
 */
export function DeliveryForm({
  initialPoId,
  initialEditId,
  onSuccess,
  onCancel,
}: DeliveryFormProps) {
  const { form, pos, isEdit, handlePOChange } = useDeliveryForm({
    initialPoId,
    initialEditId,
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
      <form.Subscribe
        selector={(state) =>
          [
            state.values.po_id,
            state.values.items,
            state.canSubmit,
            state.isSubmitting,
          ] as const
        }
      >
        {([selectedPoId, items, canSubmit, isSubmitting]) => (
          <VStack gap={6}>
            <DeliveryHeaderCard
              form={form}
              pos={pos}
              isEdit={isEdit}
              handlePOChange={handlePOChange}
            />
            {selectedPoId && items.length > 0 && (
              <DeliveryItemsCard form={form} items={items} />
            )}
            <HStack gap={2} justify="end">
              <Button
                variant="secondary"
                label="Batal"
                type="button"
                onClick={onCancel}
              />
              <Button
                variant="primary"
                label="Simpan"
                type="submit"
                isLoading={isSubmitting}
                isDisabled={!canSubmit}
              />
            </HStack>
          </VStack>
        )}
      </form.Subscribe>
    </form>
  );
}
