import type { useDeliveryForm } from "./useDeliveryForm";
import { DeliveryItemsCardInner } from "./DeliveryItemsCardInner";

export interface DeliveryItemsCardProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
}

/**
 * Card yang menampilkan tabel item delivery dengan input volume.
 * Hanya muncul setelah PO dipilih dan memiliki item.
 */
export function DeliveryItemsCard({ form }: DeliveryItemsCardProps) {
  return (
    <form.Subscribe selector={(state) => [state.values.po_id, state.values.items] as const}>
      {([poId, items]) => {
        if (!poId || items.length === 0) {
          return null;
        }
        return <DeliveryItemsCardInner form={form} items={items} />;
      }}
    </form.Subscribe>
  );
}
