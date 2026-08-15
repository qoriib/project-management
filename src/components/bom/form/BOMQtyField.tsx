import { VStack } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { getFieldError } from "@/utils/form";
import type { useBOMForm } from "./useBOMForm";

interface BOMQtyFieldProps {
  form: ReturnType<typeof useBOMForm>["form"];
  isDisabled?: boolean;
}

/**
 * Field input volume rencana pada form BOM.
 */
export function BOMQtyField({ form, isDisabled }: BOMQtyFieldProps) {
  return (
    <VStack width={200}>
      <form.Field name="qty">
        {(field) => (
          <NumberInput
            label="Volume Rencana"
            placeholder="Contoh: 1500"
            value={field.state.value || null}
            onChange={(val) => field.handleChange(val || 0)}
            onBlur={field.handleBlur}
            statusVariant="attached"
            status={getFieldError(
              field.state.meta.errors,
              !!field.state.meta.isTouched
            )}
            isDisabled={isDisabled}
          />
        )}
      </form.Field>
    </VStack>
  );
}
