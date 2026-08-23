import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
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
    <Layout
      height="fill"
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader
              title="Daftar Pemesanan (PO)"
              subtitle="Kelola dan pantau seluruh pemesanan pembelian"
              actions={selectedProjectId ? <Button variant="primary" label="Buat Baru" onClick={openNew} /> : null}
            />
            <ProjectRequired>
              <OrderTable onEdit={openEdit} />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/order/")({
  component: POListPage,
});
