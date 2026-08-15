import { VStack, Selector } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import type { useDeliveryForm } from "./useDeliveryForm";
import { formatEntityCode } from "@/components/shared/EntityCode";

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
export function DeliveryPOSelector({
  form,
  pos,
  isEdit,
  handlePOChange,
}: DeliveryPOSelectorProps) {
  const poOptions = pos.map((p) => ({
    value: String(p.po_id),
    label: formatEntityCode("PO", p.po_id),
  }));

  return (
    <VStack width={380}>
      <form.Field name="po_id">
        {(field) => (
          <Selector
            label="Pilih PO"
            placeholder="Pilih nomor PO..."
            value={field.state.value}
            onChange={(v) => handlePOChange(v as string)}
            onBlur={field.handleBlur}
            statusVariant="attached"
            status={getFieldError(
              field.state.meta.errors,
              !!field.state.meta.isTouched
            )}
            isRequired
            isDisabled={isEdit}
            options={poOptions}
          />
        )}
      </form.Field>
    </VStack>
  );
}
