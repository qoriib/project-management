import { createFileRoute } from '@tanstack/react-router';
import { useState } from "react";
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { BOMTable } from "@/components/bom/BOMTable";
import { BOMForm } from "@/components/bom/BOMForm";
import { useAppStore } from "@/store/useAppStore";
import type { BOMDetail } from "@/db/repositories";

function BOMPage() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [editData, setEditData] = useState<BOMDetail | undefined>(undefined);

  function handleSuccess() {
    setEditData(undefined);
  }

  function handleCancelEdit() {
    setEditData(undefined);
  }

  return (
    <Section padding={6}>
      <VStack style={{ minHeight: 'calc(100vh - 48px)' }}>
        <VStack gap={4} style={{ flex: 1 }}>
          <PageHeader
            title="Rencana Kebutuhan (BOM)"
            subtitle="Rincian item yang dibutuhkan untuk proyek ini"
          />
          <ProjectRequired>
            <BOMTable
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
            <BOMForm
              initialData={editData}
              onSuccess={handleSuccess}
              onCancel={handleCancelEdit}
            />
          </VStack>
        )}
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/bom/')({
  component: BOMPage,
});
