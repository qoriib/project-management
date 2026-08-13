import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from "react";
import { Section, VStack, Button, Dialog, Text } from "@astryxdesign/core";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { PageHeader } from "@/components/PageHeader";
import { BOMTable } from "@/components/bom/BOMTable";
import { BOMForm } from "@/components/bom/BOMForm";
import type { BillOfMaterial, ProjectStage } from "@/db/queries/bom";
import { getProjectStages } from "@/db/queries/bom";
import { useAppStore } from "@/store/useAppStore";

function BOMPage() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // BOM Form Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState<BillOfMaterial | undefined>(undefined);

  async function loadStages() {
    if (!selectedProjectId) {
      setStages([]);
      return;
    }
    const data = await getProjectStages(selectedProjectId);
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
      <VStack gap={4}>
        <PageHeader
          title="Rencana Kebutuhan (BOM)"
          subtitle="Rincian material dan alat yang dibutuhkan untuk proyek ini."
          actions={
            <Button 
              variant="primary" 
              label="+ Tambah Rincian" 
              onClick={() => { setEditData(undefined); setIsDialogOpen(true); }} 
              isDisabled={!selectedProjectId}
            />
          }
        />

        <TabList value={activeTab} onChange={setActiveTab} hasDivider>
          <Tab value="all" label="Semua" />
          {stages.map(s => (
            <Tab key={s.stage_id} value={String(s.stage_id)} label={s.stage_name} />
          ))}
        </TabList>

        <BOMTable 
          stageId={activeTab === "all" ? undefined : Number(activeTab)}
          refreshTrigger={refreshTrigger} 
          onEdit={(id, data) => { setEditData(data); setIsDialogOpen(true); }} 
        />
      </VStack>

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && handleClose()} width={550}>
        <BOMForm 
          stageId={activeTab === "all" ? undefined : Number(activeTab)}
          initialData={editData}
          onSuccess={handleSuccess} 
          onCancel={handleClose} 
        />
      </Dialog>
    </Section>
  );
}

export const Route = createFileRoute('/bom/')({
  component: BOMPage,
});
