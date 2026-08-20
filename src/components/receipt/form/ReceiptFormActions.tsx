import { Button, HStack, VStack } from "@astryxdesign/core";
import { Banner } from "@astryxdesign/core/Banner";
import type { useReceiptForm } from "./useReceiptForm";

export function ReceiptFormActions({
  form,
  onCancel,
}: {
  form: ReturnType<typeof useReceiptForm>["form"];
  onCancel: () => void;
}) {
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
                        : (
                            field.state.meta.errors[0] as unknown as {
                              message?: string;
                            }
                          )?.message
                    }
                  />
                ) : null
              }
            </form.Field>
          )}
          <HStack gap={2} justify="end">
            <Button variant="secondary" label="Batal" type="button" onClick={onCancel} />
            <Button variant="primary" label="Simpan" type="submit" isLoading={isSubmitting} isDisabled={!canSubmit} />
          </HStack>
        </VStack>
      )}
    </form.Subscribe>
  );
}
