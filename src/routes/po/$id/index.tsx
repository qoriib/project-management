import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Section, VStack, HStack, Button, Card, Heading, Text, Table,
} from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { PageHeader } from "@/components/shared/PageHeader";
import { purchaseOrderRepo, deliveryRepo, type POWithSummary, type POItemDetail, type DeliveryItemByPO } from "@/db/repositories";
import { formatRupiah, formatDate, formatNumber } from "@/utils/formatters";

function PODetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const [po, setPO] = useState<POWithSummary | null>(null);
  const [items, setItems] = useState<POItemDetail[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItemByPO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [p, its, delItems] = await Promise.all([
        purchaseOrderRepo.findByIdWithSummary(Number(id)),
        purchaseOrderRepo.findItems(Number(id)),
        deliveryRepo.findItemsByPO(Number(id)),
      ]);
      setPO(p);
      setItems(its);
      setDeliveryItems(delItems);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <Section padding={6}><Text color="secondary">Memuat data PO…</Text></Section>;
  if (!po) return <Section padding={6}><Text color="secondary">PO tidak ditemukan.</Text></Section>;

  const itemColumns = [
    { key: "item_name", header: "Barang / Material", width: proportional(1.5), renderCell: (row: POItemDetail) => row.item_name },
    { key: "vendor_name", header: "Vendor", width: proportional(1.5), renderCell: (row: POItemDetail) => row.vendor_name || "—" },
    { key: "price", header: "Harga Satuan", width: pixel(140), renderCell: (row: POItemDetail) => formatRupiah(row.price) },
    { key: "qty", header: "Vol. Kontrak", width: pixel(120), renderCell: (row: POItemDetail) => `${formatNumber(row.qty, 2)} ${row.unit ?? ""}` },
    { key: "total_terkirim", header: "Terkirim", width: pixel(120), renderCell: (row: POItemDetail) => `${formatNumber(row.total_terkirim, 2)} ${row.unit ?? ""}` },
    { key: "sisa", header: "Sisa", width: pixel(120), renderCell: (row: POItemDetail) => `${formatNumber(row.sisa, 2)} ${row.unit ?? ""}` },
    { key: "subtotal", header: "Total Harga", width: pixel(150), renderCell: (row: POItemDetail) => <Text weight="medium">{formatRupiah((row.qty || 0) * (row.price || 0))}</Text> },
  ];

  const deliveryColumns = [
    { key: "delivery_date", header: "Tanggal Kirim", width: pixel(140), renderCell: (row: any) => formatDate(row.delivery_date) },
    { key: "item_name", header: "Barang / Material", width: proportional(2), renderCell: (row: any) => row.item_name },
    { key: "vendor_name", header: "Vendor Pemasok", width: proportional(1.5), renderCell: (row: any) => row.vendor_name || "—" },
    { key: "qty", header: "Volume Diterima", width: pixel(180), renderCell: (row: any) => `${formatNumber(row.qty, 2)} ${row.unit ?? ""}` },
  ];

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title={`Detail PO-${po.po_id}`}
          subtitle={`Proyek: ${po.project_name ?? "—"} • Dibuat pada ${formatDate(po.po_date)} • Estimasi Total: ${formatRupiah(po.total_price)}`}
          actions={
            <HStack gap={2}>
              <Button variant="ghost" label="← Kembali" onClick={() => navigate({ to: "/po" })} />
            </HStack>
          }
        />

        {/* Item & Volume Tracking Table */}
        <VStack gap={2}>
          <HStack justify="between" align="center">
            <Heading level={3}>Item PO & Tracking Realisasi</Heading>
          </HStack>
          <Card padding={0}>
            <Table
              textOverflow="truncate"
              columns={itemColumns as any}
              data={items as any}
              idKey="po_item_id"
              emptyState={<VStack align="center" padding={4}><Text color="secondary">Tidak ada item dalam PO ini.</Text></VStack>}
            />
          </Card>
        </VStack>

        {/* Delivery History */}
        <VStack gap={2}>
          <HStack gap={2} justify="between" align="center">
            <Heading level={3}>Log Penerimaan Lapangan (Surat Jalan)</Heading>
            <Button size="sm" variant="secondary" label="Input Pengiriman Baru" onClick={() => navigate({ to: "/delivery/new", search: { po: String(po.po_id) } })} />
          </HStack>
          <Card padding={0}>
            <Table
              textOverflow="truncate"
              columns={deliveryColumns as any}
              data={deliveryItems as any}
              idKey="delivery_item_id"
              emptyState={<VStack align="center" padding={4}><Text color="secondary">Belum ada realisasi pengiriman material untuk PO ini.</Text></VStack>}
            />
          </Card>
        </VStack>
      </VStack>
    </Section>
  );
}


export const Route = createFileRoute('/po/$id/')({
  component: PODetailPage,
});
