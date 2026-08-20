import { VStack } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";

interface DeliveryQtyCellProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
  row: DeliveryItemRow;
  idx: number;
}

/**
 * Cell input volume yang diterima untuk satu baris item delivery.
 * Menampilkan error dari dua sumber: level-row (v.custom) dan level-field (onChange validator).
 */
export function DeliveryQtyCell({ form, row, idx }: DeliveryQtyCellProps) {
  return (
    <VStack gap={0.5}>
      <form.Field name={`items[${idx}]`}>
        {(field) => {
          const rowErr = getFieldError(
            field.state.meta.errors,
            field.state.meta.isTouched,
          );
          return (
            <form.Field
              name={`items[${idx}].qty`}
              validators={{
                onChange: ({ value }) => {
                  const val = value as number;
                  if (val > (row.remaining || 0)) {
                    return `Melebihi sisa PO (${formatNumber(row.remaining, 2)}).`;
                  }
                  return;
                },
              }}
            >
              {(qtyField) => {
                const qtyErr = getFieldError(
                  qtyField.state.meta.errors,
                  qtyField.state.meta.isTouched,
                );

                return (
                  <NumberInput
                    label="Volume"
                    isLabelHidden
                    statusVariant="tooltip"
                    value={qtyField.state.value as number}
                    onChange={(v) => qtyField.handleChange(v || 0)}
                    onBlur={qtyField.handleBlur}
                    status={rowErr || qtyErr}
                  />
                );
              }}
            </form.Field>
          );
        }}
      </form.Field>
    </VStack>
  );
}
