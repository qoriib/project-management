import { Card, VStack, HStack } from "@astryxdesign/core";
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
      <HStack gap={6} align="start">
        <VStack gap={4} width={400}>
          <DeliveryPOSelector
            form={form}
            pos={pos}
            isEdit={isEdit}
            handlePOChange={handlePOChange}
          />
        </VStack>

        <DeliveryDateField form={form} />
      </HStack>
    </Card>
  );
}
