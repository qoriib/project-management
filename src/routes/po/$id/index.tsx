import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@astryxdesign/core/Toast";
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { Section, VStack, HStack, Button, Card, Heading, Text } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { purchaseOrderRepo, deliveryRepo, type POWithSummary, type POItemDetail, type DeliveryItemByPO } from "@/db/repositories";
import { getDashboardBOMReport, type DashboardBOMReportItem } from "@/db/services";
import { formatRupiah, formatDate } from "@/utils/formatters";
import { POItemTrackingTable } from "@/components/po/POItemTrackingTable";
import { PODeliveryLogTable } from "@/components/po/PODeliveryLogTable";

function PODetailPage() {
  const navigate = useNavigate();

  const { id } = useParams({ strict: false });
  const [po, setPO] = useState<POWithSummary | null>(null);
  const [items, setItems] = useState<POItemDetail[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItemByPO[]>([]);
  const [bomData, setBomData] = useState<DashboardBOMReportItem[]>([]);
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
      const p = await purchaseOrderRepo.findByIdWithSummary(Number(id));
      if (p) {
        const [its, delItems, bom] = await Promise.all([
          purchaseOrderRepo.findItems(Number(id)),
          deliveryRepo.findItemsByPO(Number(id)),
          getDashboardBOMReport(p.project_id)
        ]);
        setPO(p);
        setItems(its);
        setDeliveryItems(delItems);
        setBomData(bom);
      }
      setLoading(false);
    }
    load();
  }, [id]);

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
        <PageHeader title={`Detail PO-${String(po.po_id).padStart(4, "0")}`} />
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
        <VStack gap={2}>
          <HStack justify="between" align="center">
            <Heading level={3}>Tracking Realisasi</Heading>
          </HStack>
          <Card padding={4}>
            <POItemTrackingTable items={items} bomData={bomData} />
          </Card>
        </VStack>
        <VStack gap={3}>
          <HStack gap={2} justify="between" align="center">
            <Heading level={3}>Log Penerimaan</Heading>
            <Button variant="secondary" label="Tambah Baru" onClick={() => navigate({ to: "/delivery/new", search: { po: String(po.po_id) } })} />
          </HStack>
          <Card padding={4}>
            <PODeliveryLogTable deliveryItems={deliveryItems} onDeleteRequest={(id, label) => setDeleteTarget({ id, label })} />
          </Card>
        </VStack>
        <HStack justify="start">
          <Button variant="secondary" label="Kembali" onClick={() => navigate({ to: "/po" })} />
        </HStack>
      </VStack>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDelivery}
        title="Hapus Pengiriman"
        message={`Hapus ${deleteTarget?.label}? Semua item dalam log pengiriman ini akan ikut terhapus.`}
        isLoading={deleting}
      />
    </Section>
  );
}

export const Route = createFileRoute('/po/$id/')({
  component: PODetailPage,
});
