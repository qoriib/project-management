import { createFileRoute } from "@tanstack/react-router";
import { VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { RequirementTable } from "@/components/requirement/RequirementTable";
import { RequirementApprovalActions } from "@/components/requirement/RequirementApprovalActions";

function BOMPage() {
  return (
    <Layout
      height="fill"
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader
              title="Rencana Kebutuhan (BOM)"
              subtitle="Daftar dan rincian kebutuhan material proyek"
              actions={<RequirementApprovalActions />}
            />
            <ProjectRequired>
              <RequirementTable />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/requirement/")({
  component: BOMPage,
});
