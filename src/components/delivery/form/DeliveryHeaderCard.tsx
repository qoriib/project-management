import { Card, HStack } from "@astryxdesign/core";
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
export function DeliveryHeaderCard({
  form,
  pos,
  isEdit,
  handlePOChange,
}: DeliveryHeaderCardProps) {
  return (
    <Card padding={4}>
      <HStack gap={3} align="start">
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
