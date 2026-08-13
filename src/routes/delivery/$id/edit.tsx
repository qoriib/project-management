import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { DeliveryForm } from "@/components/delivery/DeliveryForm";

function EditDeliveryPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  function handleSuccess(poId: number) {
    navigate({ to: `/po/${poId}` });
  }

  function goBack() {
    navigate({ to: "/delivery" });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader title={`Edit Pengiriman #${id}`} subtitle="Ubah log penerimaan barang atau jasa di lapangan" />

        <ProjectRequired>
          <DeliveryForm
            initialEditId={Number(id)}
            onSuccess={handleSuccess}
            onCancel={goBack}
          />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/delivery/$id/edit')({
  component: EditDeliveryPage,
});
