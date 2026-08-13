import { createFileRoute } from '@tanstack/react-router';
import { useState } from "react";
import { Section, VStack, Button, Dialog } from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { POTable } from "@/components/po/POTable";
import { POForm } from "@/components/po/POForm";

function POListPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function handleSuccess() {
    setIsDialogOpen(false);
    setEditId(undefined);
    setRefreshTrigger((r) => r + 1);
  }

  function openNew() {
    setEditId(undefined);
    setIsDialogOpen(true);
  }

  function openEdit(id: number) {
    setEditId(id);
    setIsDialogOpen(true);
  }

  function handleClose() {
    setIsDialogOpen(false);
    setEditId(undefined);
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Daftar Purchase Order"
          subtitle="Manajemen dan pelacakan seluruh dokumen Purchase Order (PO)"
          actions={<Button variant="primary" label="+ Buat PO Baru" onClick={openNew} />}
        />

        <POTable refreshTrigger={refreshTrigger} onEdit={openEdit} />
      </VStack>

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && handleClose()} width={950}>
        <POForm 
          initialEditId={editId}
          onSuccess={handleSuccess} 
          onCancel={handleClose} 
        />
      </Dialog>
    </Section>
  );
}

export const Route = createFileRoute('/po/')({
  component: POListPage,
});
