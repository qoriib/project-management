import { createFileRoute } from '@tanstack/react-router';
import { useState } from "react";
import { z } from 'zod';
import { Section, VStack, Dialog, Button } from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { DeliveryTable } from "@/components/delivery/DeliveryTable";
import { DeliveryForm } from "@/components/delivery/DeliveryForm";

function DeliveryPage() {
  const { po: initialPoId } = Route.useSearch();
  // If there's an initial PO ID in the URL, open the dialog automatically
  const [isDialogOpen, setIsDialogOpen] = useState(!!initialPoId);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function handleSuccess() {
    setIsDialogOpen(false);
    setRefreshTrigger((r) => r + 1);
  }

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Penerimaan Lapangan"
          subtitle="Log kronologis penerimaan barang dan jasa sewa di lapangan"
          actions={
            <Button variant="primary" label="+ Input Pengiriman" onClick={() => setIsDialogOpen(true)} />
          }
        />
        
        <DeliveryTable refreshTrigger={refreshTrigger} />
      </VStack>

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={700}>
        <DeliveryForm 
          initialPoId={initialPoId} 
          onSuccess={handleSuccess} 
          onCancel={() => setIsDialogOpen(false)} 
        />
      </Dialog>
    </Section>
  );
}

const searchSchema = z.object({
  po: z.string().optional(),
});

export const Route = createFileRoute('/delivery/')({
  validateSearch: searchSchema,
  component: DeliveryPage,
});
