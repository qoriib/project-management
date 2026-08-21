import { VStack, TextInput } from "@astryxdesign/core";
import { sanitizeDecimalInput } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import type { ReceiptItemRow } from "./receipt.schema";
import type { useReceiptForm } from "./useReceiptForm";

interface ReceiptQtyCellProps {
  form: ReturnType<typeof useReceiptForm>["form"];
  row: ReceiptItemRow;
  idx: number;
}

/**
 * Cell input volume yang diterima untuk satu baris item receipt.
 * Menampilkan error dari dua sumber: level-row (v.custom) dan level-field (onChange validator).
 */
export function ReceiptQtyCell({ form, idx }: ReceiptQtyCellProps) {
  return (
    <VStack gap={0.5}>
      <form.Field name={`items[${idx}]`}>
        {(field) => {
          const rowErr = getFieldError(field.state.meta.errors, field.state.meta.isTouched);
          return (
            <form.Field name={`items[${idx}].qty`}>
              {(qtyField) => {
                const qtyErr = getFieldError(qtyField.state.meta.errors, qtyField.state.meta.isTouched);

                return (
                  <TextInput
                    label="Volume"
                    isLabelHidden
                    statusVariant="tooltip"
                    value={String(qtyField.state.value ?? "")}
                    onChange={(v) => qtyField.handleChange(sanitizeDecimalInput(v))}
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
