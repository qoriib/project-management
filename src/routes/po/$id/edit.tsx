import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Section, Text, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { POForm } from "@/components/po/POForm";
import { usePOStore } from "@/store/usePOStore";

function POEditPage() {
  const { id } = useParams({ strict: false });
  const { currentPO: po, currentItems, currentBOMData, loadPODetail, clearPODetail } = usePOStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      await loadPODetail(id as string);
      setLoading(false);
    }

    load();

    return () => clearPODetail();
  }, [id, loadPODetail, clearPODetail]);

  if (loading) {
    return <LoadingState message="Memuat data PO…" />;
  }

  if (!po) {
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
          title="Edit Pemesanan"
          subtitle="Perbarui informasi dan daftar item pesanan pembelian"
        />
        <POForm po={po} initialItems={currentItems} bomData={currentBOMData} />
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute("/po/$id/edit")({
  component: POEditPage,
});
