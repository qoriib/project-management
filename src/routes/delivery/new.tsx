import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { Section, VStack, Text } from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { DeliveryForm } from "@/components/delivery/DeliveryForm";
import { useAppStore } from "@/store/useAppStore";

const searchSchema = z.object({
  po: z.string().optional(),
});

function NewDeliveryPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { po: initialPoId } = Route.useSearch();

  function goBack() {
    navigate({ to: "/delivery" });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader title="Input Pengiriman Baru" subtitle="Catat log penerimaan barang atau jasa di lapangan" />
        
        {!selectedProjectId ? (
          <VStack align="center" padding={12}>
            <Text color="secondary">Silakan pilih Proyek Aktif di menu samping terlebih dahulu.</Text>
          </VStack>
        ) : (
          <DeliveryForm 
            initialPoId={initialPoId} 
            onSuccess={goBack} 
            onCancel={goBack} 
          />
        )}
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/delivery/new')({
  validateSearch: searchSchema,
  component: NewDeliveryPage,
});
