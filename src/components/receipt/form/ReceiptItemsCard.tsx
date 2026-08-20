import type { useReceiptForm } from "./useReceiptForm";
import { ReceiptItemsCardInner } from "./ReceiptItemsCardInner";

export interface ReceiptItemsCardProps {
  form: ReturnType<typeof useReceiptForm>["form"];
}

/**
 * Card yang menampilkan tabel item receipt dengan input volume.
 * Hanya muncul setelah Order dipilih dan memiliki item.
 */
export function ReceiptItemsCard({ form }: ReceiptItemsCardProps) {
  return (
    <form.Subscribe selector={(state) => [state.values.order_id, state.values.items] as const}>
      {([poId, items]) => {
        if (!poId || items.length === 0) {
          return null;
        }
        return <ReceiptItemsCardInner form={form} items={items} />;
      }}
    </form.Subscribe>
  );
}
