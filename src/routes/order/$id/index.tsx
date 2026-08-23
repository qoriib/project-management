import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, Grid, GridSpan, HStack, Heading, Section, Text, Timestamp, VStack } from "@astryxdesign/core";
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
  if (loading) return <LoadingState message="Memuat data Order…" />;
  if (!order)
    return (
      <Section padding={4}>
        <Text color="secondary">Pemesanan tidak ditemukan.</Text>
      </Section>
    );
  return (
    <Section padding={4} maxWidth="100%">
      <VStack gap={3}>
        <PageHeader
          title="Detail Pemesanan"
          subtitle={`Tracking PO ${order.order_code} : status per item & log NP`}
          actions={
            <HStack gap={2} wrap="wrap">
              <Button variant="secondary" size="sm" label="Kembali" onClick={() => navigate({ to: "/order" })} />
              <Button
                variant="primary"
                size="sm"
                label="Edit PO"
                onClick={() => navigate({ to: `/order/${order.order_id}/edit` })}
              />
            </HStack>
          }
        />
        <Grid gap={3} columns={{ max: 3, minWidth: 220 }}>
          <GridSpan columns={1}>
            <Card padding={3}>
              <VStack gap={1}>
                <Text size="sm" color="secondary" type="label">
                  Nomor Order
                </Text>
                <Text weight="semibold" type="code" className="pm-tabular">
                  {order.order_code || "-"}
                </Text>
              </VStack>
            </Card>
          </GridSpan>
          <GridSpan columns={1}>
            <Card padding={3}>
              <VStack gap={1}>
                <Text size="sm" color="secondary" type="label">
                  Tanggal Order
                </Text>
                <Text weight="medium">
                  {order.order_date ? <Timestamp value={order.order_date} format="system_date" size="base" /> : "-"}
                </Text>
              </VStack>
            </Card>
          </GridSpan>
          <GridSpan columns={1}>
            <Card padding={3}>
              <VStack gap={1}>
                <Text size="sm" color="secondary" type="label">
                  Ringkas
                </Text>
                <Text size="sm" color="secondary">
                  Buat Penerimaan untuk catat NP terkait PO ini
                </Text>
              </VStack>
            </Card>
          </GridSpan>
        </Grid>
        <VStack gap={2}>
          <Heading level={4}>Rincian Item & Pemenuhan</Heading>
          <VStack gap={0} className="pm-table-wrap">
            <OrderItemTrackingTable />
          </VStack>
        </VStack>
        <Card padding={3}>
          <VStack gap={2}>
            <HStack gap={2} justify="between" align="center" wrap="wrap">
              <Heading level={4}>Log Penerimaan Terkait</Heading>
              <Button
                variant="secondary"
                size="sm"
                label="Buat Penerimaan"
                onClick={() => navigate({ search: { order: String(order.order_id) }, to: "/receipt/new" })}
              />
            </HStack>
            <VStack gap={0} className="pm-table-wrap">
              <OrderReceiptLogTable />
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/order/$id/")({
  component: PODetailPage,
});
