import { Card, VStack, Heading, Table } from "@astryxdesign/core";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";
import { buildDeliveryItemColumns } from "./DeliveryItemColumns";
import { DeliveryItemsError } from "./DeliveryItemsError";

interface DeliveryItemsCardProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
  items: DeliveryItemRow[];
}

/**
 * Card yang menampilkan tabel item delivery dengan input volume.
 * Hanya muncul setelah PO dipilih dan memiliki item.
 */
export function DeliveryItemsCard({ form, items }: DeliveryItemsCardProps) {
  const columns = buildDeliveryItemColumns(form, items);

  return (
    <Card padding={4}>
      <VStack gap={4}>
        <Heading level={3}>Daftar Item Diterima</Heading>

        <DeliveryItemsError form={form} />

        <Table
          verticalAlign="top"
          columns={columns}
          data={items}
        />
      </VStack>
    </Card>
  );
}
