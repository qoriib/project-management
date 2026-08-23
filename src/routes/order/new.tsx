import { createFileRoute } from "@tanstack/react-router";
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderForm } from "@/components/order/OrderForm";

function NewOrderPage() {
  return (
    <Section padding={4} style={{ maxWidth: "100%" }}>
      <VStack gap={3}>
        <PageHeader title="Pemesanan Baru" subtitle="Buat PO : pilih vendor & volume dengan cek sisa BOM" />
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
