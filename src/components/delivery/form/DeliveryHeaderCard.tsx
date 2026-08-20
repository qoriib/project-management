import { FormLayout } from "@astryxdesign/core/FormLayout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { getFieldError } from "@/utils/form";
import { DeliveryPOSelector } from "./DeliveryPOSelector";
import { DeliveryDateField } from "./DeliveryDateField";
import type { useDeliveryForm } from "./useDeliveryForm";

interface DeliveryHeaderCardProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
  pos: ReturnType<typeof useDeliveryForm>["pos"];
  isEdit: boolean;
  handlePOChange: (poId: string) => Promise<void>;
}

/**
 * Header form Delivery: berisi selector PO dengan detailnya dan tanggal kirim/terima.
 */
export function DeliveryHeaderCard({ form, pos, isEdit, handlePOChange }: DeliveryHeaderCardProps) {
  return (
    <FormLayout direction="horizontal">
      <DeliveryPOSelector form={form} pos={pos} isEdit={isEdit} handlePOChange={handlePOChange} />
      <form.Field name="delivery_code">
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
      <DeliveryDateField form={form} />
    </FormLayout>
  );
}
