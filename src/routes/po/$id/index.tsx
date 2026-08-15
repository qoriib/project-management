
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { Section, VStack, HStack, Button, Card, Heading, Text } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatRupiah, formatDate } from "@/utils/formatters";
import { usePOStore } from "@/store/usePOStore";
import { POItemTrackingTable } from "@/components/po/POItemTrackingTable";
import { PODeliveryLogTable } from "@/components/po/PODeliveryLogTable";

function PODetailPage() {
  const navigate = useNavigate();

  const { id } = useParams({ strict: false });
  const { currentPO: po, loadPODetail, clearPODetail } = usePOStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      await loadPODetail(Number(id));
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
          title={`Detail PO-${String(po.po_id).padStart(4, "0")}`}
          actions={<Button variant="secondary" label="Kembali" onClick={() => navigate({ to: "/po" })} />}
        />
        <HStack gap={8}>
          <VStack gap={1}>
            <Text color="secondary" size="sm">Dibuat Pada</Text>
            <Text weight="medium">{formatDate(po.po_date)}</Text>
          </VStack>
          <VStack gap={1}>
            <Text color="secondary" size="sm">Estimasi Total</Text>
            <Text weight="medium">{formatRupiah(po.total_price)}</Text>
          </VStack>
        </HStack>
        <Card padding={4}>
          <VStack gap={4}>
            <Heading level={3}>Tracking Realisasi</Heading>
            <POItemTrackingTable />
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={4}>
            <HStack gap={2} justify="between" align="center">
              <Heading level={3}>Log Penerimaan</Heading>
              <Button variant="secondary" label="Tambah Baru" onClick={() => navigate({ to: "/delivery/new", search: { po: String(po.po_id) } })} />
            </HStack>
            <PODeliveryLogTable />
          </VStack>
        </Card>
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/po/$id/')({
  component: PODetailPage,
});
