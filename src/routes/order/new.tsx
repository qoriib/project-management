import { createFileRoute } from "@tanstack/react-router";
import { Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderForm } from "@/components/order/OrderForm";

function NewOrderPage() {
  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Pemesanan Baru</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Buat pesanan pembelian baru
              </Text>
            </VStack>
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <ProjectRequired>
              <OrderForm />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/order/new")({
  component: NewOrderPage,
});
