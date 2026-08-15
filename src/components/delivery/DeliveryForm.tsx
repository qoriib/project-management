import { VStack, HStack, Button } from "@astryxdesign/core";
import { Banner } from "@astryxdesign/core/Banner";
import { useDeliveryForm } from "./form/useDeliveryForm";
import { DeliveryHeaderCard } from "./form/DeliveryHeaderCard";
import { DeliveryItemsCard } from "./form/DeliveryItemsCard";
import type { DeliveryFormProps } from "./form/delivery.schema";
export type { DeliveryFormProps };

function DeliveryFormActions({ form, onCancel }: { form: ReturnType<typeof useDeliveryForm>["form"]; onCancel: () => void }) {
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isSubmitted] as const}>
      {([canSubmit, isSubmitting, isSubmitted]) => (
        <VStack gap={4}>
          {isSubmitted && (
            <form.Field name="items">
              {(field) =>
                field.state.meta.errors.length > 0 ? (
                  <Banner
                    status="error"
                    title={
                      typeof field.state.meta.errors[0] === "string"
                        ? field.state.meta.errors[0]
                        : (field.state.meta.errors[0] as unknown as { message?: string })?.message
                    }
                  />
                ) : null
              }
            </form.Field>
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
  );
}

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
      <VStack gap={4}>
        <DeliveryHeaderCard
          form={form}
          pos={pos}
          isEdit={isEdit}
          handlePOChange={handlePOChange}
        />
        <DeliveryItemsCard form={form} />
        <DeliveryFormActions form={form as any} onCancel={onCancel} />
      </VStack>
    </form>
  );
}
