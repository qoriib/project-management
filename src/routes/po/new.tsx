import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { POForm } from "@/components/po/POForm";

function NewPOPage() {
  const navigate = useNavigate();

  function goBack() {
    navigate({ to: "/po" });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader title="Buat Purchase Order Baru" subtitle="Isi form di bawah untuk membuat PO baru" />
        <POForm onSuccess={goBack} onCancel={goBack} />
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/po/new')({
  component: NewPOPage,
});
