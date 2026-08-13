import { createFileRoute } from "@tanstack/react-router";
import { MasterTabUnit } from "@/components/master/MasterTabUnit";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/master/satuan")({
  component: MasterSatuanPage,
});

function MasterSatuanPage() {
  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data Satuan"
          subtitle="Kelola data satuan"
          actions={
            <Button
              variant="primary"
              label="Tambah Satuan"
              onClick={() => window.dispatchEvent(new CustomEvent('openMasterCreate'))}
            />
          }
        />
        <MasterTabUnit />
      </VStack>
    </Section>
  );
}
