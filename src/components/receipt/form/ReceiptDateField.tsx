import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { getFieldError } from "@/utils/form";
import type { useReceiptForm } from "./useReceiptForm";

interface ReceiptDateFieldProps {
  form: ReturnType<typeof useReceiptForm>["form"];
}

/**
 * Field tanggal terima pada form Receipt.
 */
export function ReceiptDateField({ form }: ReceiptDateFieldProps) {
  return (
    <form.Field name="receipt_date">
      {(field) => (
        <DateInput
          format="system_date"
          label="Tanggal Terima"
          statusVariant="attached"
          value={field.state.value as DateInputProps["value"]}
          onChange={(v) => field.handleChange(v ?? "")}
          onBlur={field.handleBlur}
          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
          isRequired
        />
      )}
    </form.Field>
  );
}
