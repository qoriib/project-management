import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { MasterUnitTable } from "@/components/master/MasterUnitTable";
import { MasterUnitForm } from "@/components/master/MasterUnitForm";
import type { Unit } from "@/db/repositories";

export const Route = createFileRoute("/master/satuan")({
  component: MasterSatuanPage,
});

function MasterSatuanPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Unit | null>(null);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('openMasterCreate', handleOpen);
    return () => window.removeEventListener('openMasterCreate', handleOpen);
  }, []);

  function openCreate() {
    setEditTarget(null);
    setIsFormOpen(true);
  }

  function openEdit(unit: Unit) {
    setEditTarget(unit);
    setIsFormOpen(true);
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data Satuan"
          subtitle="Kelola data satuan"
          actions={
            <Button
              variant="primary"
              label="Tambah Satuan"
              onClick={openCreate}
            />
          }
        />
        <MasterUnitTable onEdit={openEdit} />
        <MasterUnitForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          initialData={editTarget} 
        />
      </VStack>
    </Section>
  );
}
