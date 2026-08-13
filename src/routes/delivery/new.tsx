import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { DeliveryForm } from "@/components/delivery/DeliveryForm";

const searchSchema = z.object({
  po: z.string().optional(),
});

function NewDeliveryPage() {
  const navigate = useNavigate();
  const { po: initialPoId } = Route.useSearch();

  function goBack() {
    navigate({ to: "/delivery" });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader title="Input Pengiriman Baru" subtitle="Catat log penerimaan barang atau jasa di lapangan" />

        <ProjectRequired>
          <DeliveryForm
            initialPoId={initialPoId}
            onSuccess={goBack}
            onCancel={goBack}
          />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/delivery/new')({
  validateSearch: searchSchema,
  component: NewDeliveryPage,
});
