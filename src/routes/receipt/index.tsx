import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptTable } from "@/components/receipt/ReceiptTable";
import { useAppStore } from "@/store/useAppStore";

function ReceiptPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  return (
    <Layout
      height="fill"
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader
              title="Daftar Penerimaan (NP)"
              subtitle="Kelola dan pantau riwayat penerimaan barang"
              actions={
                selectedProjectId ? (
                  <Button variant="primary" label="Buat Baru" onClick={() => navigate({ to: "/receipt/new" })} />
                ) : null
              }
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
