import { createFileRoute } from "@tanstack/react-router";
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderForm } from "@/components/order/OrderForm";

function NewOrderPage() {
  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader title="Pemesanan Baru" subtitle="Buat pesanan pembelian item ke vendor" />
        <ProjectRequired>
          <OrderForm />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/order/new")({
  component: NewOrderPage,
});
