import { HStack, IconButton } from "@astryxdesign/core";
import { Check, X } from "lucide-react";

export function EditActionsCell({
  onCancel,
  onSave,
  isSubmitting,
  canSubmit,
}: {
  onCancel: () => void;
  onSave: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}) {
  return (
    <HStack gap={2} justify="end">
      <IconButton
        icon={<Check size={16} />}
        size="sm"
        type="button"
        label="Simpan"
        variant="primary"
        onClick={onSave}
        isLoading={isSubmitting}
        isDisabled={!canSubmit}
      />
      <IconButton
        icon={<X size={16} />}
        size="sm"
        variant="secondary"
        type="button"
        label="Batal"
        onClick={onCancel}
        isDisabled={isSubmitting}
      />
    </HStack>
  );
}
