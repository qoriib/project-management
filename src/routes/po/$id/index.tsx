import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@astryxdesign/core/Toast";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Section, VStack, HStack, Button, Card, Heading, Text, Table, IconButton } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
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

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const showToast = useToast();

  async function handleDeleteDelivery() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deliveryRepo.delete(deleteTarget.id);
      showToast({ body: "Pengiriman berhasil dihapus", type: "info" });
      setDeleteTarget(null);
      // reload
      const [p, its, delItems] = await Promise.all([
        purchaseOrderRepo.findByIdWithSummary(Number(id)),
        purchaseOrderRepo.findItems(Number(id)),
        deliveryRepo.findItemsByPO(Number(id)),
      ]);
      setPO(p);
      setItems(its);
      setDeliveryItems(delItems);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus pengiriman", type: "error" });
    } finally {
      setDeleting(false);
    }
  }


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

  if (loading) return <Section padding={6}><Text color="secondary">Memuat data PO…</Text>
    <ConfirmDialog
      isOpen={!!deleteTarget}
      onClose={() => setDeleteTarget(null)}
      onConfirm={handleDeleteDelivery}
      title="Hapus Pengiriman"
      message={`Hapus ${deleteTarget?.label}? Semua item dalam log pengiriman ini akan ikut terhapus.`}
      isLoading={deleting}
    />
  </Section>
    ;
  if (!po) return <Section padding={6}><Text color="secondary">PO tidak ditemukan.</Text></Section>;

  const itemColumns = [
    { key: "item_name", header: "Barang / Material", width: proportional(1.5), renderCell: (row: POItemDetail) => row.item_name },
    { key: "price", header: "Harga Satuan", width: pixel(140), renderCell: (row: POItemDetail) => formatRupiah(row.price) },
    { key: "qty", header: "Vol. Kontrak", width: pixel(120), renderCell: (row: POItemDetail) => `${formatNumber(row.qty, 2)} ${row.unit ?? ""}` },
    { key: "sisa", header: "Sisa", width: pixel(120), renderCell: (row: POItemDetail) => `${formatNumber(row.sisa, 2)} ${row.unit ?? ""}` },
    { key: "subtotal", header: "Total Harga", width: pixel(150), renderCell: (row: POItemDetail) => <Text weight="medium">{formatRupiah((row.qty || 0) * (row.price || 0))}</Text> },
    {
      key: "progress", header: "Realisasi", width: proportional(1.5), renderCell: (row: POItemDetail) => {
        const pct = row.qty > 0 ? ((row.total_terkirim || 0) / row.qty) * 100 : 0;
        return (
          <VStack gap={1} style={{ width: '100%' }}>
            <HStack justify="between">
              <Text size="sm" color="secondary" weight="medium">{`${formatNumber(row.total_terkirim || 0, 2)} ${row.unit ?? ""}`}</Text>
              <Text size="sm" color="primary" weight="bold">{pct.toFixed(0)}%</Text>
            </HStack>
            <ProgressBar value={row.total_terkirim || 0} max={row.qty || 1} variant={pct >= 100 ? "success" : "accent"} label="Progress" />
          </VStack>
        );
      }
    },
  ];

  const deliveryColumns = [
    { key: "delivery_date", header: "Tanggal Kirim", width: pixel(140), renderCell: (row: any) => formatDate(row.delivery_date) },
    { key: "item_name", header: "Barang / Material", width: proportional(2), renderCell: (row: any) => row.item_name },
    { key: "qty", header: "Volume Diterima", width: proportional(1), renderCell: (row: any) => `${formatNumber(row.qty, 2)} ${row.unit ?? ""}` },
    {
      key: "actions", header: "", width: pixel(100), renderCell: (row: any) => (
        <HStack gap={1}>
          <IconButton size="sm" variant="secondary" icon={<Pencil size={16} />} label="Edit" onClick={() => navigate({ to: `/delivery/${row.delivery_id}/edit` })} />
          <IconButton size="sm" variant="destructive" icon={<Trash2 size={16} />} label="Hapus" onClick={() => setDeleteTarget({ id: row.delivery_id, label: `Pengiriman ${formatDate(row.delivery_date)} - ${row.item_name}` })} />
        </HStack>
      )
    },
  ];
  const totalDeliveredValue = items.reduce((acc, item) => acc + ((item.total_terkirim || 0) * (item.price || 0)), 0);
  const progressPct = (po.total_price || 0) > 0 ? (totalDeliveredValue / (po.total_price || 1)) * 100 : 0;

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader title={`Detail PO-${po.po_id}`} />

        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={4}>Informasi Purchase Order</Heading>
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

            <VStack gap={2} style={{ marginTop: 8 }}>
              <HStack justify="between">
                <Text size="sm" weight="medium">Progress Pengiriman (Berdasarkan Nilai)</Text>

              </HStack>
              <ProgressBar
                value={totalDeliveredValue}
                max={po.total_price || 1}
                label="Progress Pengiriman"
                hasValueLabel
                formatValueLabel={() => `${progressPct.toFixed(1)}%`}
                variant={progressPct >= 100 ? "success" : "accent"}
              />
            </VStack>
          </VStack>
        </Card>

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

        <HStack justify="start">
          <Button variant="secondary" label="Kembali" onClick={() => navigate({ to: "/po" })} />
        </HStack>
      </VStack>
    </Section>
  );
}


export const Route = createFileRoute('/po/$id/')({
  component: PODetailPage,
});
