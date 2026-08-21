import { TextInput } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import { sanitizeDecimalInput } from "@/utils/formatters";
import type { BaseCellProps } from "./types";

export function QtyInputCell({ form }: BaseCellProps) {
  return (
    <form.Field name="qty">
      {(field) => (
        <TextInput
          isLabelHidden
          label="Volume"
          statusVariant="tooltip"
          value={String(field.state.value ?? "")}
          onChange={(v) => field.handleChange(sanitizeDecimalInput(v))}
          onBlur={field.handleBlur}
          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
        />
      )}
    </form.Field>
  );
}
