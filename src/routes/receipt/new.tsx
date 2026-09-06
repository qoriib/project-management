import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
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
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Penerimaan Baru</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Catat bukti penerimaan barang masuk
              </Text>
            </VStack>
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
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
