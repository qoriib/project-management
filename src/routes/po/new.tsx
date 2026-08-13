import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Section, VStack, Text } from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { ProjectRequired } from "@/components/ProjectRequired";
import { POForm } from "@/components/po/POForm";
import { useAppStore } from "@/store/useAppStore";

function NewPOPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  function goBack() {
    navigate({ to: "/po" });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader title="Buat Purchase Order Baru" subtitle="Isi form di bawah untuk membuat PO baru" />
        
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
