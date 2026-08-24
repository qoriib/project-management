import { useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptTable } from "@/components/receipt/ReceiptTable";
import { useAppStore } from "@/store/useAppStore";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";

function ReceiptPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const openNew = useCallback(() => {
    navigate({ to: "/receipt/new" });
  }, [navigate]);

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
              title="Daftar Penerimaan (NP)"
              subtitle="Kelola dan pantau riwayat penerimaan barang"
              actions={selectedProjectId ? <Button variant="primary" label="Buat Baru" onClick={openNew} /> : null}
            />
            <ProjectRequired>
              <ReceiptTable />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/receipt/")({
  component: ReceiptPage,
});
