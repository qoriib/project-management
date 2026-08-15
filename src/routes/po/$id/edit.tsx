import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { POForm } from "@/components/po/POForm";
import { formatEntityCode } from '@/components/shared/EntityCode';

function EditPOPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  function goBack() {
    navigate({ to: "/po" });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title={`Edit Pemesanan ${formatEntityCode("PO", id)}`}
          subtitle="Ubah pesanan pembelian item ke vendor"
        />
        <POForm initialEditId={Number(id)} onSuccess={goBack} onCancel={goBack} />
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/po/$id/edit')({
  component: EditPOPage,
});
