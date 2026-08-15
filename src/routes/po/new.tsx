import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { POForm } from "@/components/po/POForm";

function NewPOPage() {
  const navigate = useNavigate();

  function goBack() {
    navigate({ to: "/po" });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Pemesanan Baru"
          subtitle="Buat pesanan pembelian item ke vendor"
        />

        <ProjectRequired>
          <POForm onSuccess={goBack} onCancel={goBack} />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/po/new')({
  component: NewPOPage,
});
