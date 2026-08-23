import { createFileRoute } from "@tanstack/react-router";
import { VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderForm } from "@/components/order/OrderForm";

function NewOrderPage() {
  return (
    <Layout
      height="fill"
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader title="Pemesanan Baru" subtitle="Buat pesanan pembelian baru" />
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
