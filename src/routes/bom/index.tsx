import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from "react";
import { Section, VStack, Dialog, Selector } from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { ProjectRequired } from "@/components/ProjectRequired";
import { BOMTable } from "@/components/bom/BOMTable";
import { BOMForm } from "@/components/bom/BOMForm";
import { bomRepo, type BOMDetail, type ProjectStageWithProject } from "@/db/repositories";
import { useAppStore } from "@/store/useAppStore";

function BOMPage() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [stages, setStages] = useState<ProjectStageWithProject[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // BOM Form Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState<BOMDetail | undefined>(undefined);

  async function loadStages() {
    if (!selectedProjectId) {
      setStages([]);
      return;
    }
    const data = await bomRepo.findStagesByProject(selectedProjectId);
    setStages(data);
  }

  useEffect(() => {
    loadStages();
    // Reset tab to all if project changes
    setActiveTab("all");
  }, [selectedProjectId]);

  function handleSuccess() {
    setIsDialogOpen(false);
    setEditData(undefined);
    setRefreshTrigger((r) => r + 1);
  }

  function handleClose() {
    setIsDialogOpen(false);
    setEditData(undefined);
  }

  return (
    <Section padding={6}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 48px)' }}>
        <VStack gap={4} style={{ flex: 1 }}>
          <PageHeader
            title="Kebutuhan (BOM)"
            subtitle="Rincian material dan alat yang dibutuhkan untuk proyek ini."
            actions={
              <Selector
                label="Tahapan"
                isLabelHidden
                options={[
                  { label: "Semua Tahapan", value: "all" },
                  ...stages.map(s => ({ label: s.stage_name, value: String(s.stage_id) }))
                ]}
                value={activeTab}
                onChange={setActiveTab}
                placeholder="Pilih Tahapan"
                width={300}
              />
            }
          />

          <ProjectRequired>
            <BOMTable
              stageId={activeTab === "all" ? undefined : Number(activeTab)}
              refreshTrigger={refreshTrigger}
              onEdit={(_, data) => { setEditData(data); setIsDialogOpen(true); }}
            />
          </ProjectRequired>
        </VStack>

        <Dialog isOpen={isDialogOpen && !!editData} onOpenChange={(open) => !open && handleClose()} width={550}>
          <BOMForm
            stageId={editData?.stage_id || (activeTab === "all" ? undefined : Number(activeTab))}
            initialData={editData}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        </Dialog>

        {activeTab !== "all" && selectedProjectId && (
          <div style={{
            position: "sticky",
            bottom: -24,
            padding: "16px 24px",
            background: "var(--color-bg-elevated)",
            borderTop: "1px solid var(--color-border)",
            margin: "16px -24px -24px -24px",
            zIndex: 10
          }}>
            <BOMForm
              stageId={Number(activeTab)}
              isInline
              onSuccess={() => setRefreshTrigger(r => r + 1)}
              onCancel={() => { }}
            />
          </div>
        )}
      </div>
    </Section>
  );
}

export const Route = createFileRoute('/bom/')({
  component: BOMPage,
});
