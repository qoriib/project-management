import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";

function EditReceiptPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  return (
    <Layout
      height="fill"
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader title="Edit Penerimaan" subtitle="Perbarui data penerimaan barang" />
            <ProjectRequired>
              <ReceiptForm
                initialEditId={id}
                onSuccess={(poId) => navigate({ to: `/order/${poId}` })}
                onCancel={() => navigate({ to: "/receipt" })}
              />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/receipt/$id/edit")({
  component: EditReceiptPage,
});
