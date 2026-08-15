import { VStack, Text } from "@astryxdesign/core";
import { usePOForm } from "./form/usePOForm";
import { PODateCard } from "./form/PODateCard";
import { POItemsCard } from "./form/POItemsCard";
import { POFormActions } from "./form/POFormActions";

// ── Re-exports (for consumers that import from POForm) ─────────────────────────
export type { POItemRow } from "./form/po.schema";

// ── POForm ────────────────────────────────────────────────────────────────────

interface POFormProps {
  initialEditId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Entry point untuk form Create / Edit Purchase Order.
 * Hanya bertanggung jawab mengkomposisikan sub-komponen;
 * seluruh logic ada di `usePOForm`.
 */
export function POForm({ initialEditId, onSuccess, onCancel }: POFormProps) {
  const { form, bomData, priceCache, getPricesForItem, loading, vendors } =
    usePOForm({ initialEditId, onSuccess });

  if (loading) {
    return (
      <VStack padding={4}>
        <Text>Memuat data...</Text>
      </VStack>
    );
  }

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
            state.values.items,
            state.canSubmit,
            state.isSubmitting,
          ] as const
        }
      >
        {([items, canSubmit, isSubmitting]) => (
          <VStack gap={4}>
            <PODateCard form={form} />

            <POItemsCard
              form={form}
              items={items}
              bomData={bomData}
              priceCache={priceCache}
              vendors={vendors}
              getPricesForItem={getPricesForItem}
            />

            <POFormActions
              form={form}
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              onCancel={onCancel}
            />
          </VStack>
        )}
      </form.Subscribe>
    </form>
  );
}
