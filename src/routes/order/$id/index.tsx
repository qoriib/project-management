import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, Grid, GridSpan, HStack, Heading, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { useOrderStore } from "@/store/useOrderStore";
import { OrderItemTrackingTable } from "@/components/order/OrderItemTrackingTable";
import { OrderReceiptLogTable } from "@/components/order/OrderReceiptLogTable";
import { formatNumber } from "@/utils/formatters";

function PODetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const { currentOrder: order, currentItems: items, loadOrderDetail, clearOrderDetail } = useOrderStore();
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
      <Layout
        height="fill"
        content={
          <LayoutContent padding={6}>
            <Text color="secondary">Pemesanan tidak ditemukan.</Text>
          </LayoutContent>
        }
      />
    );

  const totalOrderPrice =
    order.total_price ??
    items.reduce((acc, item) => {
      const dpp = (item.qty ?? 0) * (item.price ?? 0);
      const tax = item.has_tax === 1 ? dpp * 0.12 : 0;
      return acc + dpp + tax;
    }, 0);

  const totalOrderedQty = items.reduce((acc, item) => acc + (item.qty ?? 0), 0);
  const totalDeliveredQty = items.reduce((acc, item) => acc + (item.total_delivered ?? 0), 0);
  const completionPct = totalOrderedQty > 0 ? Math.min(100, (totalDeliveredQty / totalOrderedQty) * 100) : 0;
  const isComplete = totalOrderedQty > 0 && totalDeliveredQty >= totalOrderedQty;
  const isPartial = totalDeliveredQty > 0 && totalDeliveredQty < totalOrderedQty;

  return (
    <Layout
      height="fill"
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader
              title="Detail Pemesanan"
              subtitle={`Informasi dan pelacakan pemesanan ${order.order_code}`}
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

            <Grid gap={3} columns={{ max: 3, minWidth: 260 }}>
              <GridSpan columns={1}>
                <Card height="100%">
                  <Text size="sm" color="secondary" weight="medium" type="label">
                    Total Nilai Pesanan
                  </Text>
                  <Heading level={3}>Rp {formatNumber(totalOrderPrice)}</Heading>
                </Card>
              </GridSpan>
              <GridSpan columns={1}>
                <Card height="100%">
                  <Text size="sm" color="secondary" weight="medium" type="label">
                    Total Item & Volume
                  </Text>
                  <Heading level={3}>
                    {items.length} Item ({formatNumber(totalOrderedQty)} Vol)
                  </Heading>
                </Card>
              </GridSpan>
              <GridSpan columns={1}>
                <Card height="100%">
                  <Text size="sm" color="secondary" weight="medium" type="label">
                    Realisasi Penerimaan
                  </Text>
                  <Heading
                    level={3}
                    style={{
                      color: isComplete ? "var(--color-success)" : isPartial ? "var(--color-blue)" : undefined,
                    }}
                  >
                    {completionPct.toFixed(0)}% Selesai
                  </Heading>
                </Card>
              </GridSpan>
            </Grid>

            <Card padding={4}>
              <VStack gap={3}>
                <Heading level={4}>Rincian Item & Pemenuhan</Heading>
                <OrderItemTrackingTable />
              </VStack>
            </Card>

            <Card padding={4}>
              <VStack gap={3}>
                <HStack gap={2} justify="between" align="center" wrap="wrap">
                  <Heading level={4}>Log Penerimaan Terkait</Heading>
                  <Button
                    variant="secondary"
                    size="sm"
                    label="Buat Penerimaan"
                    onClick={() => navigate({ search: { order: String(order.order_id) }, to: "/receipt/new" })}
                  />
                </HStack>
                <OrderReceiptLogTable />
              </VStack>
            </Card>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/order/$id/")({
  component: PODetailPage,
});
