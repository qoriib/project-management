import { createFileRoute } from "@tanstack/react-router";
import { MasterTabItem } from "@/components/master/MasterTabItem";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/master/item")({
  component: MasterItemPage,
});

function MasterItemPage() {
  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data Item"
          subtitle="Kelola data material dan alat"
          actions={
            <Button
              variant="primary"
              label="Tambah Item"
              onClick={() => window.dispatchEvent(new CustomEvent('openMasterCreate'))}
            />
          }
        />
        <MasterTabItem />
      </VStack>
    </Section>
  );
}
