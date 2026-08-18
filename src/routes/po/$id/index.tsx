import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { Button, HStack, Text, VStack, Section, Card, Heading, Timestamp } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePOStore } from "@/store/usePOStore";
import { POItemTrackingTable } from "@/components/po/POItemTrackingTable";
import { PODeliveryLogTable } from "@/components/po/PODeliveryLogTable";
import { formatEntityCode } from "@/components/shared/EntityCode";

function PODetailPage() {
  const navigate = useNavigate();

  const { id } = useParams({ strict: false });
  const { currentPO: po, loadPODetail, clearPODetail } = usePOStore();
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
          title={`Detail ${formatEntityCode("PO", po.po_id)}`}
          actions={
            <HStack gap={2}>
              <Button variant="secondary" label="Kembali" onClick={() => navigate({ to: "/po" })} />
              <Button variant="primary" label="Edit PO" onClick={() => navigate({ to: `/po/${po.po_id}/edit` })} />
            </HStack>
          }
        />
        <HStack gap={8}>
          <VStack gap={1}>
            <Text color="secondary" size="sm">Tanggal PO</Text>
            <Text weight="medium">
              {po.po_date ? <Timestamp value={po.po_date} format="system_date" size="base" /> : "-"}
            </Text>
          </VStack>
        </HStack>
        <Card padding={4}>
          <VStack gap={4}>
            <Heading level={3}>Item PO (Rencana & Realisasi)</Heading>
            <POItemTrackingTable />
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={4}>
            <HStack gap={2} justify="between" align="center">
              <Heading level={3}>Log Penerimaan</Heading>
              <Button variant="secondary" label="Buat Baru" onClick={() => navigate({ to: "/delivery/new", search: { po: String(po.po_id) } })} />
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
