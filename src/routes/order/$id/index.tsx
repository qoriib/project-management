import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, HStack, Heading, Text, Toolbar, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { useOrderStore } from "@/store/useOrderStore";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
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
      <Layout
        height="fill"
        content={
          <LayoutContent padding={6}>
            <Text color="secondary">Pemesanan tidak ditemukan.</Text>
          </LayoutContent>
        }
      />
    );

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
            <OrderSummaryCard />
            <Card>
              <Layout
                height="auto"
                header={
                  <LayoutHeader hasDivider>
                    <Toolbar
                      label="Rincian Item & Pemenuhan"
                      startContent={<Heading level={4}>Rincian Item & Pemenuhan</Heading>}
                    />
                  </LayoutHeader>
                }
                content={
                  <LayoutContent padding={0}>
                    <OrderItemTrackingTable />
                  </LayoutContent>
                }
              />
            </Card>
            <Card>
              <Layout
                height="auto"
                header={
                  <LayoutHeader hasDivider>
                    <Toolbar
                      label="Log Penerimaan"
                      startContent={<Heading level={4}>Log Penerimaan Terkait</Heading>}
                      endContent={
                        <Button
                          variant="secondary"
                          size="sm"
                          label="Buat Penerimaan"
                          onClick={() => navigate({ search: { order: String(order.order_id) }, to: "/receipt/new" })}
                        />
                      }
                    />
                  </LayoutHeader>
                }
                content={
                  <LayoutContent padding={0}>
                    <OrderReceiptLogTable />
                  </LayoutContent>
                }
              />
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
