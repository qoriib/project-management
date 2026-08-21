import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, HStack, Heading, Section, Text, Timestamp, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { useOrderStore } from "@/store/useOrderStore";
import { OrderItemTrackingTable } from "@/components/order/OrderItemTrackingTable";
import { OrderReceiptLogTable } from "@/components/order/OrderReceiptLogTable";

function PODetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const { currentOrder: order, loadOrderDetail, clearOrderDetail } = useOrderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      await loadOrderDetail(id as string);
      setLoading(false);
    }

    load();

    return () => clearOrderDetail();
  }, [id, loadOrderDetail, clearOrderDetail]);

  if (loading) {
    return <LoadingState message="Memuat data Order…" />;
  }

  if (!order) {
    return (
      <Section padding={6}>
        <Text color="secondary">Pemesanan tidak ditemukan.</Text>
      </Section>
    );
  }

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title="Detail Pemesanan"
          subtitle="Lihat rincian pesanan dan pantau progres penerimaan barang"
          actions={
            <HStack gap={2}>
              <Button variant="secondary" label="Kembali" onClick={() => navigate({ to: "/order" })} />
              <Button
                variant="primary"
                label="Edit"
                onClick={() => navigate({ to: `/order/${order.order_id}/edit` })}
              />
            </HStack>
          }
        />
        <HStack gap={8}>
          <VStack gap={1}>
            <Text color="secondary" size="sm">
              Nomor Order
            </Text>
            <Text weight="medium" type="code">
              {order.order_code || "-"}
            </Text>
          </VStack>
          <VStack gap={1}>
            <Text color="secondary" size="sm">
              Tanggal Order
            </Text>
            <Text weight="medium">
              {order.order_date ? <Timestamp value={order.order_date} format="system_date" size="base" /> : "-"}
            </Text>
          </VStack>
        </HStack>
        <Card>
          <OrderItemTrackingTable />
        </Card>
        <Card>
          <VStack gap={4}>
            <HStack gap={2} justify="between" align="center">
              <Heading level={3}>Log Penerimaan</Heading>
              <Button
                variant="secondary"
                label="Buat Baru"
                onClick={() =>
                  navigate({
                    search: { order: String(order.order_id) },
                    to: "/receipt/new",
                  })
                }
              />
            </HStack>
            <OrderReceiptLogTable />
          </VStack>
        </Card>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/order/$id/")({
  component: PODetailPage,
});
