import { VStack } from "@astryxdesign/core";
import { usePOForm } from "./form/usePOForm";
import { PODateCard } from "./form/PODateCard";
import { POItemsCard } from "./form/POItemsCard";
import { POFormActions } from "./form/POFormActions";
export type { POItemRow } from "./form/po.schema";

interface POFormProps {
  initialEditId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Main entry component for Create / Edit Purchase Order form.
 * Composes sub-components while logic resides in `usePOForm`.
 */
export function POForm({ initialEditId, onSuccess, onCancel }: POFormProps) {
  const { form, bomData, itemPricesMap, vendors } = usePOForm({
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
      <VStack gap={4}>
        <PODateCard form={form} />
        <POItemsCard
          form={form}
          bomData={bomData}
          itemPricesMap={itemPricesMap}
          vendors={vendors}
        />
        <POFormActions
          form={form}
          onCancel={onCancel}
        />
      </VStack>
    </form>
  );
}
