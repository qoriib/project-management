import { HStack, Text, VStack } from "@astryxdesign/core";
import type { TextColor } from "@astryxdesign/core";
import type { ReactNode } from "react";

export interface ReportComparisonCellProps {
  poValue: ReactNode;
  bomValue: ReactNode;
  poLabel?: string;
  bomLabel?: string;
  poColor?: TextColor;
  poClassName?: string;
}

export function ReportComparisonCell({
  poValue,
  bomValue,
  poLabel = "PO:",
  bomLabel = "BOM:",
  poColor,
  poClassName,
}: ReportComparisonCellProps) {
  return (
    <VStack gap={0.5} align="end">
      <HStack gap={1} justify="end">
        <Text weight="medium">{poLabel}</Text>
        <Text type="code" color={poColor} className={poClassName}>
          {poValue}
        </Text>
      </HStack>
      <HStack gap={1} justify="end">
        <Text size="sm" color="secondary">
          {bomLabel}
        </Text>
        <Text type="code" size="sm" color="secondary">
          {bomValue}
        </Text>
      </HStack>
    </VStack>
  );
}
