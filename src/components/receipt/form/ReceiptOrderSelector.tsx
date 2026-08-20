import { Selector } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import type { useReceiptForm } from "./useReceiptForm";

interface ReceiptPOSelectorProps {
  form: ReturnType<typeof useReceiptForm>["form"];
  orders: ReturnType<typeof useReceiptForm>["orders"];
  isEdit: boolean;
  handlePOChange: (poId: string) => Promise<void>;
}

/**
 * Field selector untuk memilih nomor Order pada form Receipt.
 * Dinonaktifkan saat mode edit.
 */
export function ReceiptOrderSelector({ form, orders, isEdit, handlePOChange }: ReceiptPOSelectorProps) {
  const poOptions = orders.map((p) => ({
    label: p.order_code,
    value: String(p.order_id),
  }));

  return (
    <form.Field name="order_id">
      {(field) => (
        <Selector
          label="Pilih Order"
          placeholder="Pilih nomor Order..."
          value={field.state.value}
          onChange={(v) => handlePOChange(v as string)}
          onBlur={field.handleBlur}
          statusVariant="attached"
          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
          isRequired
          isDisabled={isEdit}
          options={poOptions}
        />
      )}
    </form.Field>
  );
}
