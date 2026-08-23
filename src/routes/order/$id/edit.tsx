import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { OrderForm } from "@/components/order/OrderForm";
import { useOrderStore } from "@/store/useOrderStore";

function POEditPage() {
  const { id } = useParams({ strict: false });
  const { currentOrder: order, currentItems, loadOrderDetail, clearOrderDetail } = useOrderStore();
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
            <PageHeader title="Edit Pemesanan" subtitle={`Perbarui rincian pesanan ${order.order_code}`} />
            <OrderForm order={order} initialItems={currentItems} />
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/order/$id/edit")({
  component: POEditPage,
});
