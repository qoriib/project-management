import { FormLayout } from "@astryxdesign/core/FormLayout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { getFieldError } from "@/utils/form";
import { ReceiptOrderSelector } from "./ReceiptOrderSelector";
import { ReceiptDateField } from "./ReceiptDateField";
import type { useReceiptForm } from "./useReceiptForm";

interface ReceiptHeaderCardProps {
  form: ReturnType<typeof useReceiptForm>["form"];
  orders: ReturnType<typeof useReceiptForm>["orders"];
  isEdit: boolean;
  handlePOChange: (poId: string) => Promise<void>;
}

/**
 * Header form Receipt: berisi selector Order dengan detailnya dan tanggal kirim/terima.
 */
export function ReceiptHeaderCard({ form, orders, isEdit, handlePOChange }: ReceiptHeaderCardProps) {
  return (
    <FormLayout direction="horizontal">
      <ReceiptOrderSelector form={form} orders={orders} isEdit={isEdit} handlePOChange={handlePOChange} />
      <form.Field name="receipt_code">
        {(field) => (
          <TextInput
            label="Kode Penerimaan"
            value={field.state.value}
            onChange={(v) => field.handleChange(v)}
            onBlur={field.handleBlur}
            statusVariant="attached"
            status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
            isRequired
          />
        )}
      </form.Field>
      <ReceiptDateField form={form} />
    </FormLayout>
  );
}
