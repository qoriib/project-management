import { VStack, HStack, Button } from "@astryxdesign/core";
import { useDeliveryForm } from "./form/useDeliveryForm";
import { DeliveryHeaderCard } from "./form/DeliveryHeaderCard";
import { DeliveryItemsCard } from "./form/DeliveryItemsCard";
import type { DeliveryFormProps } from "./form/delivery.schema";

export type { DeliveryFormProps };

// ── DeliveryForm ──────────────────────────────────────────────────────────────

/**
 * Entry point form Create / Edit Delivery.
 * Hanya bertanggung jawab mengkomposisikan sub-komponen;
 * seluruh logic ada di `useDeliveryForm`.
 */
export function DeliveryForm({
  initialPoId,
  initialEditId,
  onSuccess,
  onCancel,
}: DeliveryFormProps) {
  const { form, pos, isEdit, handlePOChange } = useDeliveryForm({
    initialPoId,
    initialEditId,
    onSuccess,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Subscribe
        selector={(state) =>
          [
            state.values.poId,
            state.values.items,
            state.canSubmit,
            state.isSubmitting,
          ] as const
        }
      >
        {([selectedPoId, items, canSubmit, isSubmitting]) => (
          <VStack gap={6}>
            {/* ── Header: PO Selector + Tanggal ── */}
            <DeliveryHeaderCard
              form={form}
              pos={pos}
              isEdit={isEdit}
              handlePOChange={handlePOChange}
            />

            {/* ── Items: Tabel daftar item yang diterima ── */}
            {selectedPoId && items.length > 0 && (
              <DeliveryItemsCard form={form} items={items} />
            )}

            {/* ── Action Buttons ── */}
            <HStack gap={2} justify="end">
              <Button
                variant="secondary"
                label="Batal"
                type="button"
                onClick={onCancel}
              />
              <Button
                variant="primary"
                label="Simpan Pengiriman"
                type="submit"
                isLoading={isSubmitting}
                isDisabled={!canSubmit}
              />
            </HStack>
          </VStack>
        )}
      </form.Subscribe>
    </form>
  );
}
