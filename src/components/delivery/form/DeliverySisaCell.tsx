import { VStack, Text } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import type { DeliveryItemRow } from "./delivery.schema";

interface DeliverySisaCellProps {
  row: DeliveryItemRow;
}

export function DeliverySisaCell({ row }: DeliverySisaCellProps) {
  return (
    <VStack gap={0.5}>
      <Text size="sm" weight="medium">
        Dipesan: {formatNumber(row.ordered, 2)} {row.unit}
      </Text>
      <Text size="sm" color="secondary">
        Diterima: {formatNumber(row.delivered, 2)} {row.unit}
      </Text>
    </VStack>
  );
}
