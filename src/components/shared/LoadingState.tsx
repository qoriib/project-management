import { Center, Spinner, Text, VStack } from "@astryxdesign/core";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Memuat data...",
}: LoadingStateProps) {
  return (
    <Center padding={8} height="100%" width="100%">
      <VStack align="center" gap={2}>
        <Spinner size="md" />
        <Text color="secondary">{message}</Text>
      </VStack>
    </Center>
  );
}
