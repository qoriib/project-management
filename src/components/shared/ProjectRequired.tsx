import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Center, Heading, List, ListItem, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
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
      <Card>
        <Layout
          height="auto"
          header={
            <LayoutHeader hasDivider>
              <VStack gap={1} align="center">
                <Heading level={3}>Pilih Proyek Aktif</Heading>
                <Text color="secondary" size="sm" justify="center">
                  Proyek adalah konteks tunggal untuk semua transaksi. Pilih satu proyek untuk melanjutkan.
                </Text>
              </VStack>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={projects.length > 0 ? 0 : 4}>
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
                <Center padding={4}>
                  <Button
                    variant="primary"
                    label="Buat Proyek Baru"
                    onClick={() => navigate({ to: "/master/project" })}
                  />
                </Center>
              )}
            </LayoutContent>
          }
        />
      </Card>
    );
  }

  return <>{children}</>;
}
