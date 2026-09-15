import { HStack, Text } from "@astryxdesign/core";

interface RequirementGroupHeaderProps {
  groupName: string;
}

/**
 * Header section untuk kelompok pekerjaan pada tabel rencana kebutuhan (BOQ).
 */
export function RequirementGroupHeader({ groupName }: RequirementGroupHeaderProps) {
  return (
    <HStack paddingInline={2} align="center">
      <Text weight="bold">{groupName}</Text>
    </HStack>
  );
}
