import { createFileRoute } from '@tanstack/react-router';
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { BOMTable } from "@/components/bom/BOMTable";

function BOMPage() {
  return (
    <Section padding={6}>
      <VStack style={{ minHeight: 'calc(100vh - 48px)' }}>
        <VStack gap={4} style={{ flex: 1 }}>
          <PageHeader
            title="Rencana Kebutuhan (BOM)"
            subtitle="Rincian item yang dibutuhkan untuk proyek ini"
          />
          <ProjectRequired>
            <BOMTable />
          </ProjectRequired>
        </VStack>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/bom/')({
  component: BOMPage,
});
