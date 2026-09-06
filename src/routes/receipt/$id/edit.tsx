import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";

function EditReceiptPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Edit Penerimaan</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Perbarui data penerimaan barang
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
                initialEditId={id}
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

export const Route = createFileRoute("/receipt/$id/edit")({
  component: EditReceiptPage,
});
