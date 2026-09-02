import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Grid, GridSpan, Heading, HStack, Text, VStack, Badge } from "@astryxdesign/core";
import { Item } from "@astryxdesign/core/Item";
import { Plus, FolderOpen } from "lucide-react";
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
        <VStack gap={4} align="center">
          <VStack gap={1} align="center">
            <HStack gap={2} align="center">
              <FolderOpen />
              <Heading level={3}>Pilih Proyek Aktif</Heading>
            </HStack>
            <Text color="secondary" size="sm" justify="center">
              Proyek adalah konteks tunggal untuk semua transaksi. Pilih satu proyek untuk melanjutkan.
            </Text>
          </VStack>
          {projects.length > 0 ? (
            <Grid width="100%" gap={3} columns={{ max: 2, minWidth: 280 }}>
              {projects.map((project) => (
                <GridSpan key={project.project_id} columns={1}>
                  <Card padding={3}>
                    <Item
                      density="compact"
                      label={project.project_name}
                      description={`${project.company_name} · TA ${project.fiscal_year}`}
                      endContent={
                        <HStack gap={2} align="center">
                          {project.requirements_is_approved === 1 ? (
                            <Badge variant="green" label="ACC" />
                          ) : (
                            <Badge variant="yellow" label="Draft" />
                          )}
                          <Button
                            size="sm"
                            variant="primary"
                            label="Pilih"
                            onClick={() => setSelectedProjectId(project.project_id)}
                          />
                        </HStack>
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
              icon={<Plus />}
              onClick={() => navigate({ to: "/master/project" })}
            />
          )}
        </VStack>
      </Card>
    );
  }

  return <>{children}</>;
}
