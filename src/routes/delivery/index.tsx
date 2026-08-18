import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { DeliveryTable } from "@/components/delivery/DeliveryTable";
import { useAppStore } from '@/store/useAppStore';
import { useMasterStore } from '@/store/useMasterStore';

function DeliveryPage() {
  const navigate = useNavigate();

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useMasterStore((s) => s.projects);
  const isValidProject = projects.some((p) => p.project_id === selectedProjectId);

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Daftar Penerimaan (DLV)"
          subtitle="Log kronologis penerimaan item di lapangan"
          actions={(selectedProjectId && isValidProject) ? <Button variant="primary" label="Buat Baru" onClick={() => navigate({ to: "/delivery/new" })} /> : null}
        />

        <ProjectRequired>
          <DeliveryTable />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/delivery/')({
  component: DeliveryPage,
});
