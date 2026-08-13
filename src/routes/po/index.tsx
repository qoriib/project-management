import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from "react";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { POTable } from "@/components/po/POTable";

function POListPage() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function openNew() {
    navigate({ to: "/po/new" });
  }

  function openEdit(id: number) {
    navigate({ to: `/po/${id}/edit` });
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
    </Section>
  );
}

export const Route = createFileRoute('/po/')({
  component: POListPage,
});
