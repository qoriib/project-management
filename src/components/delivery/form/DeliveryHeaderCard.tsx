import { Card, HStack } from "@astryxdesign/core";
import type { useDeliveryForm } from "./useDeliveryForm";
import { DeliveryPOSelector } from "./DeliveryPOSelector";
import { DeliveryDateField } from "./DeliveryDateField";

interface DeliveryHeaderCardProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
  pos: ReturnType<typeof useDeliveryForm>["pos"];
  isEdit: boolean;
  handlePOChange: (poId: string) => Promise<void>;
}

/**
 * Card header form Delivery: berisi selector PO dan tanggal kirim/terima.
 */
export function DeliveryHeaderCard({
  form,
  pos,
  isEdit,
  handlePOChange,
}: DeliveryHeaderCardProps) {
  return (
    <Card padding={4}>
      <HStack gap={4} align="start">
        <DeliveryPOSelector
          form={form}
          pos={pos}
          isEdit={isEdit}
          handlePOChange={handlePOChange}
        />

        <DeliveryDateField form={form} />
      </HStack>
    </Card>
  );
}
