import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Grid, GridSpan, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";

interface ProjectRequiredProps {
  children: ReactNode;
}

export function ProjectRequired({ children }: ProjectRequiredProps) {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const setSelectedProjectId = useAppStore((state) => state.setSelectedProjectId);
  const projects = useMasterStore((state) => state.projects);

  const isValidProject = projects.some((project) => project.project_id === selectedProjectId);

  if (!selectedProjectId || !isValidProject) {
    return (
      <Card padding={4}>
        <VStack gap={4} align="center">
          <VStack gap={1} align="center">
            <Heading level={3}>Pilih Proyek Aktif</Heading>
            <Text color="secondary" size="sm">
              Silakan pilih proyek di bawah ini untuk melihat data dan mengelola transaksi.
            </Text>
          </VStack>
          {projects.length > 0 ? (
            <Grid width="100%" gap={2} columns={{ max: 2, minWidth: 260 }}>
              {projects.map((project) => (
                <GridSpan key={project.project_id} columns={1}>
                  <Card padding={3}>
                    <HStack justify="between" align="center" gap={3}>
                      <VStack gap={0.5}>
                        <Text weight="bold">{project.project_name}</Text>
                        <Text size="sm" color="secondary">
                          {project.company_name} - {project.fiscal_year}
                        </Text>
                      </VStack>
                      <Button
                        size="sm"
                        variant="primary"
                        label="Pilih"
                        onClick={() => setSelectedProjectId(project.project_id)}
                      />
                    </HStack>
                  </Card>
                </GridSpan>
              ))}
            </Grid>
          ) : (
            <Button
              variant="primary"
              label="Buat Proyek Baru"
              icon={<Plus size={16} />}
              onClick={() => navigate({ to: "/master/project" })}
            />
          )}
        </VStack>
      </Card>
    );
  }

  return <>{children}</>;
}
