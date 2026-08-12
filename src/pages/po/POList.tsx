import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Section, VStack, HStack, Button, Table, Badge, TextInput, Selector, Text,
} from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { getPurchaseOrders, deletePO, type PurchaseOrder } from "../../db/queries/po";
import { getVendors, type Vendor } from "../../db/queries/master";
import { formatRupiah, formatDate } from "../../utils/formatters";

export default function POListPage() {
  const navigate = useNavigate();
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [p, v] = await Promise.all([
      getPurchaseOrders({
        vendor_id: vendorFilter ? Number(vendorFilter) : undefined,
        search: search || undefined,
      }),
      getVendors(),
    ]);
    setPOs(p);
    setVendors(v);
  }

  useEffect(() => { load(); }, [search, vendorFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePO(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "po_number", header: "No. PO", width: pixel(180) },
    { key: "po_date", header: "Tanggal", width: pixel(110), renderCell: (v: string) => formatDate(v) },
    { key: "vendor_name", header: "Vendor", width: proportional(1) },
    { key: "project_name", header: "Proyek", width: proportional(1) },
    {
      key: "total_price", header: "Total", width: pixel(160),
      renderCell: (v: number) => <Text size="sm" weight="semibold">{formatRupiah(v)}</Text>,
    },
    {
      key: "actions", header: "", width: pixel(200),
      renderCell: (_: unknown, row: PurchaseOrder) => (
        <HStack gap={1}>
          <Button size="sm" variant="tertiary" onClick={() => navigate(`/po/${row.po_id}`)}>Detail</Button>
          <Button size="sm" variant="tertiary" onClick={() => navigate(`/po/${row.po_id}/edit`)}>Edit</Button>
          <Button size="sm" variant="tertiary" sentiment="negative" onClick={() => setDeleteTarget({ id: row.po_id, label: row.po_number })}>Hapus</Button>
        </HStack>
      ),
    },
  ];

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Daftar Purchase Order"
          subtitle="Manajemen dan pelacakan seluruh dokumen Purchase Order (PO)"
          actions={<Button variant="primary" onClick={() => navigate("/po/new")}>+ Buat PO Baru</Button>}
        />

        <HStack gap={3}>
          <TextInput
            label=""
            placeholder="Cari nomor PO..."
            value={search}
            onChange={setSearch}
            width={240}
          />
          <Selector
            label="Vendor"
            isLabelHidden
            placeholder="Filter vendor..."
            value={vendorFilter}
            onChange={setVendorFilter}
            options={[
              { value: "", label: "Semua Vendor" },
              ...vendors.map((v) => ({ value: String(v.vendor_id), label: v.vendor_name })),
            ]}
            width={200}
          />
        </HStack>

        <Table
          columns={columns as any}
          data={pos as any}
          rowKey="po_id"
          hasHoverHighlight
          emptyState={
            <VStack align="center" padding={8}>
              <Text color="secondary">
                {search || vendorFilter ? "Tidak ada PO yang cocok dengan filter." : "Belum ada PO. Klik '+ Buat PO Baru' untuk memulai."}
              </Text>
            </VStack>
          }
        />
      </VStack>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus PO"
        message={`Hapus PO "${deleteTarget?.label}"? Semua item dan pengiriman terkait akan ikut terhapus.`}
        isLoading={deleting}
      />
    </Section>
  );
}
