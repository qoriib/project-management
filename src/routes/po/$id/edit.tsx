import { createFileRoute, useParams } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { VStack, Section, Text } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { POForm } from "@/components/po/POForm";
import { usePOStore } from "@/store/usePOStore";
import { formatEntityCode } from "@/components/shared/EntityCode";

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

    return () => {
      clearPODetail();
    };
  }, [id, loadPODetail, clearPODetail]);

  if (loading) {
    return (
      <Section padding={6}>
        <Text color="secondary">Memuat data PO…</Text>
      </Section>
    );
  }

  if (!po) return <Section padding={6}><Text color="secondary">PO tidak ditemukan.</Text></Section>;

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title={`Edit ${formatEntityCode("PO", po.po_id)}`}
        />
        <POForm po={po} initialItems={currentItems} bomData={currentBOMData} />
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/po/$id/edit')({
  component: POEditPage,
});
