import { ReactNode } from "react";
import { Card, VStack, Text } from "@astryxdesign/core";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";

interface ProjectRequiredProps {
  children: ReactNode;
}

export function ProjectRequired({ children }: ProjectRequiredProps) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useMasterStore((s) => s.projects);
  
  const isValidProject = projects.some(p => p.project_id === selectedProjectId);

  if (!selectedProjectId || !isValidProject) {
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
