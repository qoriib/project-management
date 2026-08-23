import { Center, Spinner, Text, VStack } from "@astryxdesign/core";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Memuat data..." }: LoadingStateProps) {
  return (
    <Center padding={6} style={{ minHeight: "40vh", width: "100%" }}>
      <VStack align="center" gap={2}>
        <Spinner size="md" />
        <Text size="sm" color="secondary">
          {message}
        </Text>
      </VStack>
    </Center>
  );
}
