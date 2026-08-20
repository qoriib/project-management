import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderTable } from "@/components/order/OrderTable";
import { useAppStore } from "@/store/useAppStore";

function POListPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  function openNew() {
    navigate({ to: "/order/new" });
  }

  function openEdit(id: string) {
    navigate({ to: `/order/${id}/edit` });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Daftar Pemesanan (PO)"
          subtitle="Manajemen dan pelacakan seluruh pemesanan"
          actions={selectedProjectId ? <Button variant="primary" label="Buat Baru" onClick={openNew} /> : null}
        />
        <ProjectRequired>
          <OrderTable onEdit={openEdit} />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/order/")({
  component: POListPage,
});
