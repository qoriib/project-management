import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Section, VStack, HStack, Button, Card, Heading, Text, Divider, Table,
} from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { PageHeader } from "@/components/PageHeader";
import { VolumeProgress } from "@/components/VolumeProgress";
import { getPOById, getPOItems, type PurchaseOrder, type POItem } from "@/db/queries/po";
import { getDeliveries, type Delivery } from "@/db/queries/field";
import { formatRupiah, formatDate } from "@/utils/formatters";

function PODetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<POItem[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [p, its, del] = await Promise.all([
        getPOById(Number(id)),
        getPOItems(Number(id)),
        getDeliveries(),
      ]);
      setPO(p);
      setItems(its);
      // filter only deliveries for this PO's items
      const poItemIds = new Set(its.map((i) => i.po_item_id));
      setDeliveries(del.filter((d) => d.po_item_id && poItemIds.has(d.po_item_id)));
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <Section padding={6}><Text color="secondary">Memuat data PO…</Text></Section>;
  if (!po) return <Section padding={6}><Text color="secondary">PO tidak ditemukan.</Text></Section>;

  const deliveryColumns = [
    { key: "delivery_date", header: "Tanggal Kirim", width: pixel(120), renderCell: (row: Delivery) => formatDate(row.delivery_date) },
    { key: "item_name", header: "Barang / Material", width: proportional(1) },
    { key: "delivered_volume", header: "Volume Kirim", width: pixel(120), renderCell: (row: Delivery) => `${row.delivered_volume} ${row.unit ?? ""}` },
    { key: "delivery_note_number", header: "No. Surat Jalan", width: pixel(140) },
    { key: "location_destination", header: "Tujuan", width: proportional(1) },
  ];

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title={`Detail PO-${po.po_id}`}
          subtitle={`Dibuat pada ${formatDate(po.po_date)}`}
          actions={
            <HStack gap={2}>
              <Button variant="ghost" label="← Kembali" onClick={() => navigate({ to: "/po" })} />
            </HStack>
          }
        />

        {/* PO Info Header */}
        <Card padding={4}>
          <HStack gap={6}>
            <VStack gap={1}>
              <Text size="2xs" color="secondary">Proyek</Text>
              <Text weight="medium">{po.project_name ?? "—"}</Text>
            </VStack>
            <VStack gap={1} style={{ marginLeft: "auto" }}>
              <Text size="2xs" color="secondary">Estimasi Total PO</Text>
              <Heading level={3} style={{ color: "var(--color-accent-500)" }}>{formatRupiah(po.total_price)}</Heading>
            </VStack>
          </HStack>
        </Card>

        {/* Volume Tracking */}
        <Card padding={4}>
          <VStack gap={4}>
            <Heading level={3}>Tracking Realisasi Volume PO vs Volume Pengiriman</Heading>
            <Divider />
            {items.map((item) => (
              <VStack gap={2} key={item.po_item_id}>
                <Text size="sm" color="secondary">Vendor: {item.vendor_name}</Text>
                <VolumeProgress
                  label={`${item.item_name}`}
                  satuan={item.unit ?? ""}
                  qtyPO={item.qty}
                  totalTerkirim={item.total_terkirim ?? 0}
                />
              </VStack>
            ))}
          </VStack>
        </Card>

        {/* Delivery History */}
        <Card padding={4}>
          <VStack gap={3}>
            <HStack gap={2} align="center">
              <Heading level={3}>Log Penerimaan Lapangan (Surat Jalan)</Heading>
              <Button size="sm" variant="secondary" label="+ Input Pengiriman Baru" onClick={() => navigate({ to: "/delivery", search: { po: String(po.po_id) } })} style={{ marginLeft: "auto" }} />
            </HStack>
            <Table
              columns={deliveryColumns as any}
              data={deliveries as any}
              idKey="delivery_id"
              emptyState={<VStack align="center" padding={4}><Text color="secondary">Belum ada realisasi pengiriman material untuk PO ini.</Text></VStack>}
            />
          </VStack>
        </Card>
      </VStack>
    </Section>
  );
}


export const Route = createFileRoute('/po/$id/')({
  component: PODetailPage,
});
