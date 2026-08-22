import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Grid, GridSpan, Heading, Text, VStack } from "@astryxdesign/core";
import { Item } from "@astryxdesign/core/Item";
import { Plus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import type { ReactNode } from "react";

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
                    <Item
                      density="compact"
                      label={project.project_name}
                      description={`${project.company_name} - ${project.fiscal_year}`}
                      endContent={
                        <Button
                          size="sm"
                          variant="primary"
                          label="Pilih"
                          onClick={() => setSelectedProjectId(project.project_id)}
                        />
                      }
                    />
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
