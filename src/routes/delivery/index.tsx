import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from "react";
import { Section, VStack, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { ProjectRequired } from "@/components/ProjectRequired";
import { DeliveryTable } from "@/components/delivery/DeliveryTable";
import { useAppStore } from "@/store/useAppStore";

function DeliveryPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Penerimaan Lapangan"
          subtitle="Log kronologis penerimaan barang dan jasa sewa di lapangan"
          actions={
            selectedProjectId ? <Button variant="primary" label="+ Input Pengiriman" onClick={() => navigate({ to: "/delivery/new" })} /> : null
          }
        />
        
        <ProjectRequired>
          <DeliveryTable refreshTrigger={refreshTrigger} />
        </ProjectRequired>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/delivery/')({
  component: DeliveryPage,
});
