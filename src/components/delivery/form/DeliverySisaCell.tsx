import { VStack, Text } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";

interface DeliverySisaCellProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
  row: DeliveryItemRow;
  idx: number;
}

export function DeliverySisaCell({ form, row, idx }: DeliverySisaCellProps) {
  return (
    <form.Subscribe selector={(state) => state.values.items[idx]?.qty}>
      {(qty = 0) => {
        const sisaAkhir = row.sisa - qty;
        return (
          <VStack gap={0.5}>
            <Text size="sm" weight="medium">
              {formatNumber(sisaAkhir, 2)} {row.unit} (Sisa)
            </Text>
            <Text size="sm" color="secondary">
              Batas PO: {formatNumber(row.sisa, 2)} {row.unit}
            </Text>
          </VStack>
        );
      }}
    </form.Subscribe>
  );
}
