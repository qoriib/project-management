import { Card, HStack, Selector } from "@astryxdesign/core";
import { DateInput } from "@astryxdesign/core/DateInput";
import { getFieldError } from "@/utils/form";
import { formatPOLabel } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";

type ISODate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

interface DeliveryHeaderCardProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
  pos: ReturnType<typeof useDeliveryForm>["pos"];
  isEdit: boolean;
  handlePOChange: (poId: string) => Promise<void>;
}

// ── DeliveryHeaderCard ────────────────────────────────────────────────────────

/** Card berisi selector PO dan DateInput tanggal kirim/terima */
export function DeliveryHeaderCard({
  form,
  pos,
  isEdit,
  handlePOChange,
}: DeliveryHeaderCardProps) {
  return (
    <Card padding={4}>
      <HStack gap={4} style={{ alignItems: "flex-start" }}>
        {/* ── Selector: Nomor PO ── */}
        <div style={{ flex: 1 }}>
          <form.Field name="poId">
            {(field) => (
              <Selector
                label="Pilih PO"
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
                options={[
                  { value: "", label: "Pilih nomor PO..." },
                  ...pos.map((p) => ({
                    value: String(p.po_id),
                    label: formatPOLabel(p.po_id, p.vendor_names),
                  })),
                ]}
              />
            )}
          </form.Field>
        </div>

        {/* ── DateInput: Tanggal Kirim / Terima ── */}
        <div style={{ width: 240 }}>
          <form.Field name="deliveryDate">
            {(field) => (
              <DateInput
                label="Tanggal Kirim / Terima"
                value={field.state.value as ISODate}
                onChange={(v) => field.handleChange(v || "")}
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
        </div>
      </HStack>
    </Card>
  );
}
