import { createFileRoute } from "@tanstack/react-router";
import { MasterTabVendor } from "@/components/master/MasterTabVendor";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";

export const Route = createFileRoute("/master/vendor")({
  component: MasterVendorPage,
});

function MasterVendorPage() {
  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data Vendor"
          subtitle="Kelola data vendor/supplier"
          actions={
            <Button
              variant="primary"
              label="Tambah Vendor"
              onClick={() => window.dispatchEvent(new CustomEvent('openMasterCreate'))}
            />
          }
        />
        <MasterTabVendor />
      </VStack>
    </Section>
  );
}
