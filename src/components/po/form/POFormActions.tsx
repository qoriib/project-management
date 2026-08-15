import { HStack, Button } from "@astryxdesign/core";
import { Banner } from "@astryxdesign/core/Banner";
import type { usePOForm } from "./usePOForm";

interface POFormActionsProps {
  form: ReturnType<typeof usePOForm>["form"];
  onCancel: () => void;
}

function POFormActionsInner({
  form,
  canSubmit,
  isSubmitting,
  onCancel,
}: POFormActionsProps & { canSubmit: boolean; isSubmitting: boolean }) {
  return (
    <>
      <form.Field name="items">
        {(field) =>
          field.state.meta.errors.length > 0 ? (
            <Banner
              status="error"
              title={
                typeof field.state.meta.errors[0] === "string"
                  ? field.state.meta.errors[0]
                  : (field.state.meta.errors[0] as unknown as { message?: string })
                    ?.message
              }
            />
          ) : null
        }
      </form.Field>
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
    </>
  );
}

/** Displays form-level error banner and Cancel/Save action buttons */
export function POFormActions(props: POFormActionsProps) {
  return (
    <props.form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
      {([canSubmit, isSubmitting]) => (
        <POFormActionsInner {...props} canSubmit={canSubmit} isSubmitting={isSubmitting} />
      )}
    </props.form.Subscribe>
  );
}
