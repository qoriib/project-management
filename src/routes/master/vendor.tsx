import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { MasterVendorTable } from "@/components/master/MasterVendorTable";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
import type { Vendor } from "@/db/repositories";

export const Route = createFileRoute("/master/vendor")({
  component: MasterVendorPage,
});

function MasterVendorPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('openMasterCreate', handleOpen);
    return () => window.removeEventListener('openMasterCreate', handleOpen);
  }, []);

  function openCreate() {
    setEditTarget(null);
    setIsFormOpen(true);
  }

  function openEdit(vendor: Vendor) {
    setEditTarget(vendor);
    setIsFormOpen(true);
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data Vendor"
          subtitle="Kelola data vendor"
          actions={
            <Button
              variant="primary"
              label="Tambah Vendor"
              onClick={openCreate}
            />
          }
        />
        <MasterVendorTable onEdit={openEdit} />
        <MasterVendorForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          initialData={editTarget} 
        />
      </VStack>
    </Section>
  );
}
