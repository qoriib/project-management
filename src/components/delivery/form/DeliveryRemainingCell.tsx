import { VStack, Text } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import type { DeliveryItemRow } from "./delivery.schema";

interface DeliveryRemainingCellProps {
  row: DeliveryItemRow;
}

export function DeliveryRemainingCell({ row }: DeliveryRemainingCellProps) {
  return (
    <VStack gap={0.5}>
      <Text weight="medium">
        Diterima: {formatNumber(row.delivered, 2)} {row.unit}
      </Text>
      <Text size="sm" color="secondary">
        Dipesan: {formatNumber(row.ordered, 2)} {row.unit}
      </Text>
    </VStack>
  );
}
