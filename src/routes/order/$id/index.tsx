import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, HStack, Heading, Text, Toolbar, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { LoadingState } from "@/components/shared/LoadingState";
import { useOrderStore } from "@/store/useOrderStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { OrderItemTrackingTable } from "@/components/order/OrderItemTrackingTable";
import { OrderReceiptLogTable } from "@/components/order/OrderReceiptLogTable";
import { handleFormError } from "@/utils/form";

function OrderDetailPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { id } = useParams({ strict: false });
  const { currentOrder: order, currentItems: items, loadOrderDetail, clearOrderDetail } = useOrderStore();
  const [loading, setLoading] = useState(true);
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);

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

  async function handleCreateReceipt() {
    if (!order || isCreatingReceipt) return;
    try {
      setIsCreatingReceipt(true);
      const newId = await useReceiptStore.getState().createReceiptForOrder(order.order_id, order.project_id);
      showToast({ body: "Penerimaan baru berhasil dibuat", type: "info" });
      navigate({ to: `/receipt/${newId}/edit` });
    } catch (error: unknown) {
      handleFormError(error, showToast);
    } finally {
      setIsCreatingReceipt(false);
    }
  }

  if (loading) return <LoadingState message="Memuat data Order…" />;

  if (!order)
    return (
      <Layout
        height="fill"
        content={
          <LayoutContent padding={6}>
            <Text color="secondary">Pengadaan tidak ditemukan.</Text>
          </LayoutContent>
        }
      />
    );

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Detail Pengadaan</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                {`Informasi dan pelacakan pengadaan ${order.order_code}`}
              </Text>
            </VStack>
            <HStack gap={2} wrap="wrap">
              <Button
                variant="primary"
                size="sm"
                label="Edit Pengadaan"
                onClick={() => navigate({ to: `/order/${order.order_id}/edit` })}
              />
            </HStack>
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
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
                          onClick={handleCreateReceipt}
                          isDisabled={isCreatingReceipt || items.length === 0}
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
  component: OrderDetailPage,
});
