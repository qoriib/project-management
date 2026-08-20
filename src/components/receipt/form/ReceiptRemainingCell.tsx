import { HStack, Text, VStack } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import type { ReceiptItemRow } from "./receipt.schema";

interface ReceiptRemainingCellProps {
  row: ReceiptItemRow;
}

export function ReceiptRemainingCell({ row }: ReceiptRemainingCellProps) {
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
