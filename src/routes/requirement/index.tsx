import { createFileRoute } from "@tanstack/react-router";
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { RequirementTable } from "@/components/requirement/RequirementTable";
import { RequirementApprovalActions } from "@/components/requirement/RequirementApprovalActions";

function BOMPage() {
  return (
    <Section padding={6}>
      <VStack style={{ minHeight: "calc(100vh - 48px)" }}>
        <VStack gap={4} style={{ flex: 1 }}>
          <PageHeader
            title="Rencana Kebutuhan (BOM)"
            subtitle="Rincian item yang dibutuhkan untuk proyek ini"
            actions={<RequirementApprovalActions />}
          />
          <ProjectRequired>
            <RequirementTable />
          </ProjectRequired>
        </VStack>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/requirement/")({
  component: BOMPage,
});
