import { NumberInput } from "@astryxdesign/core/NumberInput";
import { getFieldError } from "@/utils/form";
import type { BaseCellProps } from "./types";

export function QtyInputCell({ form }: BaseCellProps) {
  return (
    <form.Field name="qty">
      {(field) => (
        <NumberInput
          isLabelHidden
          label="Volume"
          statusVariant="tooltip"
          value={field.state.value}
          onChange={(v) => field.handleChange(v ?? 0)}
          onBlur={field.handleBlur}
          min={0}
          step={0.000001}
          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
        />
      )}
    </form.Field>
  );
}
