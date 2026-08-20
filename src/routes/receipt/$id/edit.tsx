import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";

function EditReceiptPage() {
  const navigate = useNavigate(),
    { id } = Route.useParams();

  function handleSuccess(poId: string) {
    navigate({ to: `/order/${poId}` });
  }

  function goBack() {
    navigate({ to: "/receipt" });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader title={`Edit Penerimaan`} subtitle="Ubah log penerimaan item di lapangan" />
        <ProjectRequired>
          <ReceiptForm initialEditId={id} onSuccess={handleSuccess} onCancel={goBack} />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/receipt/$id/edit")({
  component: EditReceiptPage,
});
