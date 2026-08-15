import { HStack, Button } from "@astryxdesign/core";
import { Banner } from "@astryxdesign/core/Banner";
import type { usePOForm } from "./usePOForm";

interface POFormActionsProps {
  form: ReturnType<typeof usePOForm>["form"];
  canSubmit: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
}

// ── POFormActions ─────────────────────────────────────────────────────────────

/**
 * Menampilkan banner error validasi level-form dan tombol aksi Batal / Simpan.
 */
export function POFormActions({
  form,
  canSubmit,
  isSubmitting,
  onCancel,
}: POFormActionsProps) {
  return (
    <>
      {/* Banner error jika items array kosong / invalid */}
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

      {/* Action buttons */}
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
