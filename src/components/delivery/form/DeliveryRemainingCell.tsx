import { HStack, Text, VStack } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import type { DeliveryItemRow } from "./delivery.schema";

interface DeliveryRemainingCellProps {
  row: DeliveryItemRow;
}

export function DeliveryRemainingCell({ row }: DeliveryRemainingCellProps) {
  return (
    <VStack gap={0.5} align="end">
      <HStack gap={1} justify="end">
        <Text weight="medium">Diterima:</Text>
        <Text type="code">
          {formatNumber(row.delivered, 2)} {row.unit}
        </Text>
      </HStack>
      <HStack gap={1} justify="end">
        <Text size="sm" color="secondary">
          Dipesan:
        </Text>
        <Text type="code" size="sm" color="secondary">
          {formatNumber(row.ordered, 2)} {row.unit}
        </Text>
      </HStack>
    </VStack>
  );
}
