import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from "react";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { ProjectRequired } from "@/components/ProjectRequired";
import { POTable } from "@/components/po/POTable";
import { useAppStore } from "@/store/useAppStore";

function POListPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
          title="Daftar Purchase Order"
          subtitle="Manajemen dan pelacakan seluruh dokumen Purchase Order (PO)"
          actions={selectedProjectId ? <Button variant="primary" label="Buat Baru" onClick={openNew} /> : null}
        />

        <ProjectRequired>
          <POTable refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(r => r + 1)} onEdit={openEdit} />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/po/')({
  component: POListPage,
});
