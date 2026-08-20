import { Text, VStack } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";

export function RequirementInfoCell({
  totalOrdered,
  plannedVolume,
  unit,
}: {
  totalOrdered: number;
  plannedVolume: number;
  unit: string;
}) {
  return (
    <VStack gap={0.5}>
      <Text weight="medium">
        Realisasi: {formatNumber(totalOrdered, 2)} {unit}
      </Text>
      <Text size="sm" color="secondary">
        Rencana: {formatNumber(plannedVolume, 2)} {unit}
      </Text>
    </VStack>
  );
}
