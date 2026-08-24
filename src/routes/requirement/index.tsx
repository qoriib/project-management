import { useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { RequirementTable } from "@/components/requirement/RequirementTable";
import { RequirementApprovalActions } from "@/components/requirement/RequirementApprovalActions";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import { useAppStore } from "@/store/useAppStore";

function BOMPage() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const dispatchCreate = useCallback(() => {
    window.dispatchEvent(new CustomEvent("openRequirementCreate"));
  }, []);

  // Ctrl+N — only active when a project is selected (requirement needs a project context).
  useKeyboardShortcut({
    key: "n",
    ctrl: true,
    handler: dispatchCreate,
    enabled: Boolean(selectedProjectId),
  });

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
