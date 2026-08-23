import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Section, Text, VStack } from "@astryxdesign/core";
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
  if (!order) return (<Section padding={4}><Text color="secondary">Pemesanan tidak ditemukan.</Text></Section>);
  return (
    <Section padding={4} style={{ maxWidth: "100%" }}>
      <VStack gap={3}>
        <PageHeader title="Edit Pemesanan" subtitle={`Mengubah ${order.order_code} : sesuaikan item & vendor`} />
        <OrderForm order={order} initialItems={currentItems} />
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/order/$id/edit")({
  component: POEditPage,
});
