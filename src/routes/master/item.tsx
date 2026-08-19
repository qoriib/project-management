import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { MasterItemTable } from "@/components/master/MasterItemTable";
import { MasterItemForm } from "@/components/master/MasterItemForm";
import type { ItemWithDetails } from "@/db/repositories";

export const Route = createFileRoute("/master/item")({
  component: MasterItemPage,
});

function MasterItemPage() {
  const [isFormOpen, setIsFormOpen] = useState(false),
    [editTarget, setEditTarget] = useState<ItemWithDetails | null>(null);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener("openMasterCreate", handleOpen);
    return () => window.removeEventListener("openMasterCreate", handleOpen);
  }, []);

  function openCreate() {
    setEditTarget(null);
    setIsFormOpen(true);
  }

  function openEdit(item: ItemWithDetails) {
    setEditTarget(item);
    setIsFormOpen(true);
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data Item"
          subtitle="Kelola data item kebutuhan"
          actions={<Button variant="primary" label="Tambah Item" onClick={openCreate} />}
        />
        <MasterItemTable onEdit={openEdit} />
        <MasterItemForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editTarget}
        />
      </VStack>
    </Section>
  );
}
