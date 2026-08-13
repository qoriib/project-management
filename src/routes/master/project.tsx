import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { MasterProjectTable } from "@/components/master/MasterProjectTable";
import { MasterProjectForm } from "@/components/master/MasterProjectForm";
import type { Project } from "@/db/repositories";

export const Route = createFileRoute("/master/project")({
  component: MasterProjectPage,
});

function MasterProjectPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('openMasterCreate', handleOpen);
    return () => window.removeEventListener('openMasterCreate', handleOpen);
  }, []);

  function openCreate() {
    setEditTarget(null);
    setIsFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditTarget(project);
    setIsFormOpen(true);
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data Project"
          subtitle="Kelola data project dan tahapannya"
          actions={
            <Button
              variant="primary"
              label="Tambah Project"
              onClick={openCreate}
            />
          }
        />
        <MasterProjectTable onEdit={openEdit} />
        <MasterProjectForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          initialData={editTarget} 
        />
      </VStack>
    </Section>
  );
}
