import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { POTable } from "@/components/po/POTable";
import { useAppStore } from "@/store/useAppStore";

function POListPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  function openNew() {
    navigate({ to: "/po/new" });
  }

  function openEdit(id: number) {
    navigate({ to: `/po/${id}/edit` });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Daftar Pemesanan (PO)"
          subtitle="Manajemen dan pelacakan seluruh pemesanan"
          actions={selectedProjectId ? <Button variant="primary" label="Buat Baru" onClick={openNew} /> : null}
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
