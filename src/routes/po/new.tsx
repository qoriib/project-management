import { createFileRoute } from '@tanstack/react-router';
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { POForm } from "@/components/po/POForm";
import { usePOStore } from '@/store/usePOStore';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

function NewPOPage() {
  const { currentBOMData, loadBOMReportForProject } = usePOStore();
  const selectedProjectId = useAppStore(s => s.selectedProjectId);

  useEffect(() => {
    if (selectedProjectId) {
      loadBOMReportForProject(selectedProjectId);
    }
  }, [selectedProjectId, loadBOMReportForProject]);

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Pemesanan Baru"
          subtitle="Buat pesanan pembelian item ke vendor"
        />
        <ProjectRequired>
          <POForm bomData={currentBOMData} />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/po/new')({
  component: NewPOPage,
});
