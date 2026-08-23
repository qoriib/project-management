import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";

const searchSchema = z.object({
  order: z.string().optional(),
});

function NewReceiptPage() {
  const navigate = useNavigate();
  const { order: initialPoId } = Route.useSearch();

  return (
    <Layout
      height="fill"
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader title="Penerimaan Baru" subtitle="Catat bukti penerimaan barang masuk" />
            <ProjectRequired>
              <ReceiptForm
                initialPoId={initialPoId}
                onSuccess={(poId) => navigate({ to: `/order/${poId}` })}
                onCancel={() => navigate({ to: "/receipt" })}
              />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/receipt/new")({
  component: NewReceiptPage,
  validateSearch: searchSchema,
});
