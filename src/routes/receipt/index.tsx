import { createFileRoute } from "@tanstack/react-router";
import { Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptTable } from "@/components/receipt/ReceiptTable";

function ReceiptPage() {
  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Daftar Penerimaan (NP)</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola dan pantau riwayat penerimaan barang
              </Text>
            </VStack>
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <ProjectRequired>
              <ReceiptTable />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/receipt/")({
  component: ReceiptPage,
});
