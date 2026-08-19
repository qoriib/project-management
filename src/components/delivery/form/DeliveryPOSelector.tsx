import { Selector } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import type { useDeliveryForm } from "./useDeliveryForm";

interface DeliveryPOSelectorProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
  pos: ReturnType<typeof useDeliveryForm>["pos"];
  isEdit: boolean;
  handlePOChange: (poId: string) => Promise<void>;
}

/**
 * Field selector untuk memilih nomor PO pada form Delivery.
 * Dinonaktifkan saat mode edit.
 */
export function DeliveryPOSelector({ form, pos, isEdit, handlePOChange }: DeliveryPOSelectorProps) {
  const poOptions = pos.map((p) => ({
    label: p.po_code,
    value: String(p.po_id),
  }));

  return (
    <form.Field name="po_id">
      {(field) => (
        <Selector
          label="Pilih PO"
          placeholder="Pilih nomor PO..."
          value={field.state.value}
          onChange={(v) => handlePOChange(v as string)}
          onBlur={field.handleBlur}
          statusVariant="attached"
          status={getFieldError(field.state.meta.errors, Boolean(field.state.meta.isTouched))}
          isRequired
          isDisabled={isEdit}
          options={poOptions}
        />
      )}
    </form.Field>
  );
}
