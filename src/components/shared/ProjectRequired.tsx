import { useNavigate } from "@tanstack/react-router";
import { Button, Card, EmptyState, Heading, List, ListItem, Text, VStack } from "@astryxdesign/core";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import type { ReactNode } from "react";

interface ProjectRequiredProps {
  children: ReactNode;
}

export function ProjectRequired({ children }: ProjectRequiredProps) {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useAppStore((s) => s.setSelectedProjectId);
  const projects = useMasterStore((s) => s.projects);
  const isValidProject = projects.some((p) => p.project_id === selectedProjectId);

  if (!selectedProjectId || !isValidProject) {
    return (
      <Card padding={4}>
        <VStack gap={4} align="stretch">
          <VStack gap={1} align="center">
            <Heading level={3}>Pilih Proyek Aktif</Heading>
            <Text color="secondary" size="sm" justify="center">
              Proyek adalah konteks tunggal untuk semua transaksi. Pilih satu proyek untuk melanjutkan.
            </Text>
          </VStack>
          {projects.length > 0 ? (
            <List hasDividers density="spacious">
              {projects.map((project) => (
                <ListItem
                  key={project.project_id}
                  label={project.project_name}
                  description={`${project.company_name} · ${project.fiscal_year}`}
                  endContent={
                    <Button
                      size="sm"
                      variant="primary"
                      label="Pilih"
                      onClick={() => setSelectedProjectId(project.project_id)}
                    />
                  }
                />
              ))}
            </List>
          ) : (
            <EmptyState
              title="Belum Ada Proyek"
              description="Tidak ada proyek aktif yang tersedia. Buat proyek baru di Master Data untuk melanjutkan."
              actions={
                <Button
                  variant="primary"
                  label="Buat Proyek Baru"
                  onClick={() => navigate({ to: "/master/project" })}
                />
              }
            />
          )}
        </VStack>
      </Card>
    );
  }

  return <>{children}</>;
}
