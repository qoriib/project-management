import { useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { RequirementTable } from "@/components/requirement/RequirementTable";
import { RequirementApprovalActions } from "@/components/requirement/RequirementApprovalActions";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import { calcGrandTotal } from "@/utils/calc";
import { formatNumber } from "@/utils/formatters";

function RequirementPage() {
  const projects = useMasterStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const currentProject = projects.find((p) => p.project_id === selectedProjectId);
  const isApproved = currentProject?.requirements_is_approved === 1;

  const { requirements } = useRequirementStore();
  const grandTotal = useMemo(() => calcGrandTotal(requirements), [requirements]);

  const dispatchCreate = useCallback(() => {
    window.dispatchEvent(new CustomEvent("openRequirementCreate"));
  }, []);

  useKeyboardShortcut({
    key: "n",
    ctrl: true,
    handler: dispatchCreate,
    enabled: Boolean(selectedProjectId) && !isApproved,
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
            {selectedProjectId ? (
              <Button variant="primary" label="Tambah Item" onClick={dispatchCreate} isDisabled={isApproved} />
            ) : null}
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
      footer={
        selectedProjectId ? (
          <LayoutFooter hasDivider padding={6}>
            <HStack gap={4} vAlign="center" hAlign="between">
              <RequirementApprovalActions />
              <HStack gap={2} vAlign="center">
                <Text weight="medium" size="base" color="secondary">
                  Total:
                </Text>
                <Text type="code" weight="bold" size="lg" color="primary">
                  Rp {formatNumber(grandTotal)}
                </Text>
              </HStack>
            </HStack>
          </LayoutFooter>
        ) : null
      }
    />
  );
}

export const Route = createFileRoute("/requirement/")({
  component: RequirementPage,
});
