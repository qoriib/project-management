import { useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { RequirementTable } from "@/components/requirement/RequirementTable";
import { RequirementApprovalActions } from "@/components/requirement/RequirementApprovalActions";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import { useAppStore } from "@/store/useAppStore";

function RequirementPage() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const dispatchCreate = useCallback(() => {
    window.dispatchEvent(new CustomEvent("openRequirementCreate"));
  }, []);

  useKeyboardShortcut({
    key: "n",
    ctrl: true,
    handler: dispatchCreate,
    enabled: Boolean(selectedProjectId),
  });

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Rencana Kebutuhan (BOM)</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Daftar dan rincian kebutuhan item
              </Text>
            </VStack>
            <RequirementApprovalActions />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
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
  component: RequirementPage,
});
