import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { MasterCategoryTable } from "@/components/master/MasterCategoryTable";
import { MasterCategoryForm } from "@/components/master/MasterCategoryForm";
import type { ItemCategory } from "@/db/repositories";

export const Route = createFileRoute("/master/kategori")({
  component: MasterKategoriPage,
});

function MasterKategoriPage() {
  const [isFormOpen, setIsFormOpen] = useState(false),
    [editTarget, setEditTarget] = useState<ItemCategory | null>(null);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener("openMasterCreate", handleOpen);
    return () => window.removeEventListener("openMasterCreate", handleOpen);
  }, []);

  function openCreate() {
    setEditTarget(null);
    setIsFormOpen(true);
  }

  function openEdit(category: ItemCategory) {
    setEditTarget(category);
    setIsFormOpen(true);
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data Kategori"
          subtitle="Kelola data kategori item"
          actions={<Button variant="primary" label="Tambah Kategori" onClick={openCreate} />}
        />
        <MasterCategoryTable onEdit={openEdit} />
        <MasterCategoryForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editTarget}
        />
      </VStack>
    </Section>
  );
}
