import { TextInput } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import { sanitizeDecimalInput } from "@/utils/formatters";
import type { CellFormProps } from "./types";

interface QtyInputCellProps extends CellFormProps {}

export function QtyInputCell({ form }: QtyInputCellProps) {
  return (
    <form.Field name="qty">
      {(field) => (
        <TextInput
          label="Volume"
          isLabelHidden
          value={String(field.state.value ?? "")}
          onChange={(v) => field.handleChange(sanitizeDecimalInput(v))}
          onBlur={field.handleBlur}
          statusVariant="tooltip"
          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
        />
      )}
    </form.Field>
  );
}
