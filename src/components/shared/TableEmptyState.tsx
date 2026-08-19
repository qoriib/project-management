import { Text, VStack } from "@astryxdesign/core";

interface TableEmptyStateProps {
  message: string;
}

export function TableEmptyState({ message }: TableEmptyStateProps) {
  return (
    <VStack align="center" padding={8}>
      <Text color="secondary">{message}</Text>
    </VStack>
  );
}
