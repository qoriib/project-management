import { NumberInput } from "@astryxdesign/core/NumberInput";
import { getFieldError } from "@/utils/form";
import type { CellFormProps } from "./types";

interface QtyInputCellProps extends CellFormProps {}

export function QtyInputCell({ form }: QtyInputCellProps) {
  return (
    <form.Field name="qty">
      {(field) => (
        <NumberInput
          label="Volume"
          isLabelHidden
          value={field.state.value}
          onChange={(v) => field.handleChange(v || 0)}
          onBlur={field.handleBlur}
          statusVariant="tooltip"
          status={getFieldError(
            field.state.meta.errors,
            field.state.meta.isTouched,
          )}
        />
      )}
    </form.Field>
  );
}
