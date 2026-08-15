import { Card, VStack, Text } from "@astryxdesign/core";
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
    <VStack gap={4}>
      <Card padding={4}>
        <VStack gap={4} width={400}>
          <DeliveryPOSelector
            form={form}
            pos={pos}
            isEdit={isEdit}
            handlePOChange={handlePOChange}
          />
          <form.Subscribe selector={(state) => state.values.poId}>
            {(poId) => {
              const selectedPO = pos.find((p) => String(p.po_id) === poId);
              if (!selectedPO) return null;

              return (
                <VStack
                  gap={1}
                  padding={3}
                  style={{
                    backgroundColor: "var(--color-bg-subtle)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <Text size="sm" weight="medium">Informasi PO</Text>
                  <Text size="sm" color="secondary">
                    Vendor: {selectedPO.vendor_names || "Tidak ada"}
                  </Text>
                  <Text size="sm" color="secondary">
                    Proyek: {selectedPO.project_name || "Tidak ada"}
                  </Text>
                </VStack>
              );
            }}
          </form.Subscribe>
        </VStack>
      </Card>

      <Card padding={4}>
        <DeliveryDateField form={form} />
      </Card>
    </VStack>
  );
}
