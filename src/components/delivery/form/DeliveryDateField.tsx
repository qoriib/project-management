import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { getFieldError } from "@/utils/form";
import type { useDeliveryForm } from "./useDeliveryForm";

interface DeliveryDateFieldProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
}

/**
 * Field tanggal terima pada form Delivery.
 */
export function DeliveryDateField({ form }: DeliveryDateFieldProps) {
  return (
    <form.Field name="delivery_date">
      {(field) => (
        <DateInput
          format="system_date"
          label="Tanggal Terima"
          statusVariant="attached"
          value={field.state.value as DateInputProps["value"]}
          onChange={(v) => field.handleChange(v ?? "")}
          onBlur={field.handleBlur}
          status={getFieldError(
            field.state.meta.errors,
            field.state.meta.isTouched,
          )}
          isRequired
        />
      )}
    </form.Field>
  );
}
