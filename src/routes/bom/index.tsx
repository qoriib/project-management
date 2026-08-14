import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from "react";
import { Section, VStack, Selector, Text } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { BOMTable } from "@/components/bom/BOMTable";
import { BOMForm } from "@/components/bom/BOMForm";
import { bomRepo, type BOMDetail, type ProjectStageWithProject } from "@/db/repositories";
import { useAppStore } from "@/store/useAppStore";

function BOMPage() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [stages, setStages] = useState<ProjectStageWithProject[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editData, setEditData] = useState<BOMDetail | undefined>(undefined);

  async function loadStages() {
    if (!selectedProjectId) {
      setStages([]);
      setActiveTab("");
      return;
    }

    const data = await bomRepo.findStagesByProject(selectedProjectId);

    setStages(data);

    if (data.length > 0) {
      setActiveTab(String(data[0].stage_id));
    } else {
      setActiveTab("");
    }
  }

  useEffect(() => {
    loadStages();
  }, [selectedProjectId]);

  function handleSuccess() {
    setEditData(undefined);
    setRefreshTrigger((r) => r + 1);
  }

  function handleCancelEdit() {
    setEditData(undefined);
  }

  return (
    <Section padding={6}>
      <VStack style={{ minHeight: 'calc(100vh - 48px)' }}>
        <VStack gap={4} style={{ flex: 1 }}>
          <PageHeader
            title="Kebutuhan (BOM)"
            subtitle="Rincian material dan alat yang dibutuhkan untuk proyek ini."
            actions={
              <Selector
                label="Tahapan"
                isLabelHidden
                options={stages.map(s => ({ label: s.stage_name, value: String(s.stage_id) }))}
                value={activeTab}
                onChange={setActiveTab}
                placeholder={stages.length > 0 ? "Pilih Tahapan" : "Belum ada tahapan"}
                width={300}
                isDisabled={stages.length === 0}
              />
            }
          />
          <ProjectRequired>
            <BOMTable
              stageId={activeTab ? Number(activeTab) : undefined}
              refreshTrigger={refreshTrigger}
              onEdit={(_, data) => setEditData(data)}
            />
          </ProjectRequired>
        </VStack>
        {selectedProjectId && (
          <VStack
            style={{
              position: "sticky",
              bottom: -24,
              padding: "12px 12px",
              background: "var(--color-bg-elevated)",
              borderTop: "1px solid var(--color-border)",
              margin: "16px -24px -24px -24px",
              zIndex: 10
            }}
          >
            {!activeTab ? (
              <VStack align="center" padding={4}>
                <Text color="secondary">Silakan tambahkan Tahapan di master data proyek terlebih dahulu.</Text>
              </VStack>
            ) : (
              <BOMForm
                stageId={editData?.stage_id || Number(activeTab)}
                initialData={editData}
                onSuccess={handleSuccess}
                onCancel={handleCancelEdit}
              />
            )}
          </VStack>
        )}
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/bom/')({
  component: BOMPage,
});
