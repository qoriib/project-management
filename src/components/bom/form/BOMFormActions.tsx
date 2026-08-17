import { VStack, HStack, Button } from "@astryxdesign/core";
import type { BOMDetail } from "@/db/repositories";

interface BOMFormActionsProps {
  initialData?: BOMDetail;
  canSubmit: boolean;
  isSubmitting: boolean;
  isDisabled?: boolean;
  selectedProjectId: string | null;
  onCancel: () => void;
}

/**
 * Tombol aksi form BOM: Tambah / Simpan dan Batal (hanya saat mode edit).
 */
export function BOMFormActions({
  initialData,
  canSubmit,
  isSubmitting,
  isDisabled,
  selectedProjectId,
  onCancel,
}: BOMFormActionsProps) {
  const isEditMode = initialData !== undefined;
  const submitLabel = isEditMode ? "Simpan" : "Tambah";
  const isSubmitDisabled = isDisabled || !canSubmit || !selectedProjectId;

  return (
    <VStack style={{ paddingTop: "24px" }}>
      <HStack gap={2}>
        <Button
          variant="primary"
          label={submitLabel}
          type="submit"
          isLoading={isSubmitting}
          isDisabled={isSubmitDisabled}
        />
        {isEditMode && (
          <Button
            variant="secondary"
            label="Batal"
            onClick={onCancel}
          />
        )}
      </HStack>
    </VStack>
  );
}
