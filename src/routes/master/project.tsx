import { createFileRoute } from "@tanstack/react-router";
import { MasterTabProject } from "@/components/master/MasterTabProject";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/master/project")({
  component: MasterProjectPage,
});

function MasterProjectPage() {
  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data Proyek"
          subtitle="Kelola data proyek"
          actions={
            <Button
              variant="primary"
              label="Tambah Proyek"
              onClick={() => window.dispatchEvent(new CustomEvent('openMasterCreate'))}
            />
          }
        />
        <MasterTabProject />
      </VStack>
    </Section>
  );
}
