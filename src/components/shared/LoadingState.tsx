import { VStack, Spinner, Text } from "@astryxdesign/core";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Memuat data..." }: LoadingStateProps) {
  return (
    <VStack align="center" justify="center" padding={8} style={{ flex: 1 }}>
      <Spinner size="md" />
      <Text color="secondary" style={{ marginTop: 8 }}>
        {message}
      </Text>
    </VStack>
  );
}
