import { VStack } from "@astryxdesign/core";
import { DateInput } from "@astryxdesign/core/DateInput";
import { getFieldError } from "@/utils/form";
import type { useDeliveryForm } from "./useDeliveryForm";

type ISODate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

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
          value={field.state.value as ISODate}
          onChange={(v) => field.handleChange(v ?? "")}
          onBlur={field.handleBlur}
          statusVariant="attached"
          status={getFieldError(field.state.meta.errors, Boolean(field.state.meta.isTouched))}
          isRequired
        />
      )}
    </form.Field>
  );
}
