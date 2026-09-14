import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { RequirementTable } from "@/components/requirement/RequirementTable";
import { RequirementApprovalActions } from "@/components/requirement/RequirementApprovalActions";
import { RequirementGroupDialog } from "@/components/requirement/RequirementGroupDialog";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import { useRequirementGroupStore } from "@/store/useRequirementGroupStore";
import { calcBoqGrandTotal } from "@/utils/calc";
import { formatNumber } from "@/utils/formatters";

function RequirementPage() {
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const projects = useMasterStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const currentProject = projects.find((p) => p.project_id === selectedProjectId);
  const isApproved = currentProject?.requirements_is_approved === 1;

  const { requirements } = useRequirementStore();
  const { groups } = useRequirementGroupStore();
  const grandTotal = useMemo(() => calcBoqGrandTotal(requirements, groups), [requirements, groups]);
  const totalItems = requirements.length;
  const totalVolume = useMemo(() => requirements.reduce((sum, r) => sum + (r.qty || 0), 0), [requirements]);

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
    <>
      <Layout
        height="fill"
        header={
          <LayoutHeader hasDivider padding={6}>
            <HStack gap={2} vAlign="center" hAlign="between">
              <VStack gap={0.5}>
                <Heading level={3}>Rencana Kebutuhan (BOQ)</Heading>
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
        footer={
          selectedProjectId ? (
            <LayoutFooter hasDivider padding={6}>
              <HStack gap={4} vAlign="center" hAlign="between">
                <HStack gap={2}>
                  <Button variant="secondary" label="Tambah Item" onClick={dispatchCreate} isDisabled={isApproved} />
                  <Button variant="secondary" label="Kelola Pekerjaan" onClick={() => setIsGroupDialogOpen(true)} />
                </HStack>
                <HStack gap={6} vAlign="center">
                  <HStack gap={2} vAlign="center">
                    <Text weight="medium" size="sm" color="secondary">
                      Total Item:
                    </Text>
                    <Text type="code" weight="bold" size="sm">
                      {totalItems}
                    </Text>
                  </HStack>
                  <HStack gap={2} vAlign="center">
                    <Text weight="medium" size="sm" color="secondary">
                      Total Volume:
                    </Text>
                    <Text type="code" weight="bold" size="sm">
                      {formatNumber(totalVolume, 2)}
                    </Text>
                  </HStack>
                  <HStack gap={2} vAlign="center">
                    <Text weight="medium" size="base" color="secondary">
                      Total BOQ:
                    </Text>
                    <Text type="code" weight="bold" size="lg" color="primary">
                      Rp {formatNumber(grandTotal, 2)}
                    </Text>
                  </HStack>
                </HStack>
              </HStack>
            </LayoutFooter>
          ) : null
        }
      />
      <RequirementGroupDialog isOpen={isGroupDialogOpen} onClose={() => setIsGroupDialogOpen(false)} />
    </>
  );
}

export const Route = createFileRoute("/requirement/")({
  component: RequirementPage,
});
