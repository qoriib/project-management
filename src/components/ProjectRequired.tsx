import { ReactNode } from "react";
import { Card, VStack, Text } from "@astryxdesign/core";
import { useAppStore } from "@/store/useAppStore";

interface ProjectRequiredProps {
  children: ReactNode;
}

export function ProjectRequired({ children }: ProjectRequiredProps) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  if (!selectedProjectId) {
    return (
      <Card padding={8}>
        <VStack align="center">
          <Text color="secondary">
            Pilih Proyek Aktif di menu samping terlebih dahulu.
          </Text>
        </VStack>
      </Card>
    );
  }

  return <>{children}</>;
}
