import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { POTable } from "@/components/po/POTable";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";

function POListPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useMasterStore((s) => s.projects);
  const isValidProject = projects.some((p) => p.project_id === selectedProjectId);

  function openNew() {
    navigate({ to: "/po/new" });
  }

  function openEdit(id: string) {
    navigate({ to: `/po/${id}/edit` });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Daftar Pemesanan (PO)"
          subtitle="Manajemen dan pelacakan seluruh pemesanan"
          actions={(selectedProjectId && isValidProject) ? <Button variant="primary" label="Buat Baru" onClick={openNew} /> : null}
        />
        <ProjectRequired>
          <POTable onEdit={openEdit} />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/po/')({
  component: POListPage,
});
