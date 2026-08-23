import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";

function EditReceiptPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader title="Edit Penerimaan" subtitle="Ubah volume diterima : sistem jaga batas sisa PO" />
        <ProjectRequired>
          <ReceiptForm
            initialEditId={id}
            onSuccess={(poId) => navigate({ to: `/order/${poId}` })}
            onCancel={() => navigate({ to: "/receipt" })}
          />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/receipt/$id/edit")({
  component: EditReceiptPage,
});
