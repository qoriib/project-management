import { VStack } from "@astryxdesign/core";
import { DateInput } from "@astryxdesign/core/DateInput";
import { getFieldError } from "@/utils/form";
import type { useDeliveryForm } from "./useDeliveryForm";

type ISODate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

interface DeliveryDateFieldProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
}

/**
 * Field tanggal kirim / terima pada form Delivery.
 */
export function DeliveryDateField({ form }: DeliveryDateFieldProps) {
  return (
    <VStack width={240}>
      <form.Field name="deliveryDate">
        {(field) => (
          <DateInput
            label="Tanggal Kirim / Terima"
            value={field.state.value as ISODate}
            onChange={(v) => field.handleChange(v ?? "")}
            onBlur={field.handleBlur}
            statusVariant="attached"
            status={getFieldError(
              field.state.meta.errors,
              !!field.state.meta.isTouched
            )}
            isRequired
          />
        )}
      </form.Field>
    </VStack>
  );
}
