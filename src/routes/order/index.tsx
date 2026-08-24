import { useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderTable } from "@/components/order/OrderTable";
import { useAppStore } from "@/store/useAppStore";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";

function POListPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const openNew = useCallback(() => {
    navigate({ to: "/order/new" });
  }, [navigate]);

  function openEdit(id: string) {
    navigate({ to: `/order/${id}/edit` });
  }

  // Ctrl+N — mirrors the "Buat Baru" button guard.
  useKeyboardShortcut({
    key: "n",
    ctrl: true,
    handler: openNew,
    enabled: Boolean(selectedProjectId),
  });

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
