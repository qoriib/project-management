import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Section, VStack, HStack, Button, Table, TextInput, Selector, Text,
} from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getDeliveries, deleteDelivery, type Delivery } from "@/db/queries/field";
import { getVendors, type Vendor } from "@/db/queries/master";
import { formatDate, formatNumber } from "@/utils/formatters";
import { exportToExcel } from "@/utils/export";

function DeliveryHistoryPage() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Filters
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateDari, setDateDari] = useState("");
  const [dateSampai, setDateSampai] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [d, v] = await Promise.all([
      getDeliveries({
        vendor_id: vendorFilter ? Number(vendorFilter) : undefined,
        tanggal_dari: dateDari || undefined,
        tanggal_sampai: dateSampai || undefined,
      }),
      getVendors(),
    ]);
    setDeliveries(d);
    setVendors(v);
  }

  useEffect(() => { load(); }, [vendorFilter, dateDari, dateSampai]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDelivery(deleteTarget);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    const exportData = deliveries.map((d) => ({
      "No. PO": d.po_number || "",
      "Tanggal Kirim": formatDate(d.delivery_date),
      "Nama Material": d.item_name || "",
      "Volume Kirim": d.delivered_volume,
      "Satuan": d.unit || "",
      "No. Surat Jalan": d.delivery_note_number || "",
      "Lokasi Tujuan": d.location_destination || "",
      "Vendor": d.vendor_name || "",
      "Keterangan": d.notes || "",
    }));
    exportToExcel(exportData, `rekap-pengiriman-${new Date().toISOString().slice(0, 10)}`);
  }

  const columns = [
    { key: "delivery_date", label: "Tanggal Kirim", width: "120px", render: (v: string) => formatDate(v) },
    { key: "po_number", label: "No. PO", width: "160px" },
    { key: "vendor_name", label: "Vendor", width: "1fr" },
    { key: "item_name", label: "Material", width: "1fr" },
    {
      key: "delivered_volume", label: "Volume", width: "100px",
      render: (v: number, row: Delivery) => `${formatNumber(v, 2)} ${row.unit || ""}`
    },
    { key: "delivery_note_number", label: "No. Surat Jalan", width: "140px" },
    { key: "location_destination", label: "Lokasi", width: "1fr" },
    {
      key: "actions", label: "", width: "80px",
      render: (_: unknown, row: Delivery) => (
        <Button size="sm" label="✕" variant="destructive" onClick={() => setDeleteTarget(row.delivery_id)} />
      ),
    },
  ];

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Rekapitulasi Pengiriman Material"
          subtitle="Log kronologis penerimaan barang dan jasa sewa di lapangan"
          actions={
            <HStack gap={2}>
              <Button variant="secondary" label="📊 Export Excel" onClick={handleExport} />
              <Button variant="primary" label="+ Input Pengiriman" onClick={() => navigate({ to: "/delivery/new" })} />
            </HStack>
          }
        />

        <HStack gap={3}>
          <Selector
            label=""
            placeholder="Semua Vendor"
            value={vendorFilter}
            onChange={setVendorFilter}
            options={[
              { value: "", label: "Semua Vendor" },
              ...vendors.map((v) => ({ value: String(v.vendor_id), label: v.vendor_name })),
            ]}
            width={200}
          />
          <TextInput
            label=""
            placeholder="Dari tanggal"
            value={dateDari}
            onChange={setDateDari}
            width={160}
          />
          <TextInput
            label=""
            placeholder="Sampai tanggal"
            value={dateSampai}
            onChange={setDateSampai}
            width={160}
          />
        </HStack>

        <Table
          columns={columns as any}
          data={deliveries as any}
          idKey="delivery_id"
          emptyState={
            <VStack align="center" padding={8}>
              <Text color="secondary">Tidak ada data pengiriman yang cocok.</Text>
            </VStack>
          }
        />
      </VStack>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Log Pengiriman"
        message="Apakah Anda yakin ingin menghapus data pengiriman ini? Jumlah sisa PO terkait akan bertambah kembali."
        isLoading={deleting}
      />
    </Section>
  );
}


export const Route = createFileRoute('/delivery/history')({
  component: DeliveryHistoryPage,
});
