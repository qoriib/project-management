import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";

const searchSchema = z.object({
  order: z.string().optional(),
});

function NewReceiptPage() {
  const navigate = useNavigate();
  const { order: initialPoId } = Route.useSearch();

  function handleSuccess(poId: string) {
    navigate({ to: `/order/${poId}` });
  }

  function goBack() {
    navigate({ to: "/receipt" });
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader title="Penerimaan Baru" subtitle="Catat log penerimaan item di lapangan" />
        <ProjectRequired>
          <ReceiptForm initialPoId={initialPoId} onSuccess={handleSuccess} onCancel={goBack} />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/receipt/new")({
  component: NewReceiptPage,
  validateSearch: searchSchema,
});
