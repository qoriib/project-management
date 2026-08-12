import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Section, VStack, HStack, Button, TextInput, Selector, TextArea,
  Table, Text, Divider, Heading, Card,
} from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { PageHeader } from "@/components/PageHeader";
import { createPO, type PurchaseOrder, type POItem } from "@/db/queries/po";
import { getVendors, getItems, type Vendor, type Item } from "@/db/queries/master";
import { getProjects, type Project } from "@/db/queries/master";
import { formatRupiah, todayISO } from "@/utils/formatters";

interface ItemRow {
  item_id: number;
  item_name: string;
  unit: string;
  ordered_volume: number;
  unit_price: number;
}

function POFormPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const isEdit = !!id;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);

  // PO fields
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState(todayISO());
  const [vendorId, setVendorId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [ppn, setPPN] = useState(false);
  const [notes, setNotes] = useState("");

  // Items
  const [items, setItems] = useState<ItemRow[]>([
    { item_id: 0, item_name: "", unit: "m3", ordered_volume: 0, unit_price: 0 },
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [v, p, m] = await Promise.all([getVendors(), getProjects(), getItems()]);
      setVendors(v);
      setProjects(p);
      setCatalogItems(m);
    }
    load();
  }, []);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { item_id: 0, item_name: "", unit: "m3", ordered_volume: 0, unit_price: 0 },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof ItemRow, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        if (field === "item_id") {
          const mat = catalogItems.find((m) => m.item_id === Number(value));
          return { ...item, item_id: Number(value), item_name: mat?.item_name ?? "", unit: mat?.unit ?? "m3" };
        }
        return { ...item, [field]: value };
      })
    );
  }

  const subtotal = items.reduce((sum, it) => sum + it.ordered_volume * it.unit_price, 0);
  const ppnAmount = ppn ? subtotal * 0.12 : 0;
  const total = subtotal + ppnAmount;

  async function handleSave() {
    if (!poNumber || !vendorId) return;
    setSaving(true);
    try {
      const poData: Omit<PurchaseOrder, "po_id" | "vendor_name" | "project_name" | "subtotal_price" | "ppn_amount" | "total_price" | "created_at"> = {
        po_number: poNumber,
        po_date: poDate,
        vendor_id: Number(vendorId),
        project_id: projectId ? Number(projectId) : undefined,
        notes,
      };
      const poItems: Omit<POItem, "po_item_id" | "po_id" | "item_name" | "unit" | "subtotal_price" | "ppn_amount" | "total_price" | "total_terkirim" | "sisa">[] =
        items
          .filter((it) => it.item_id > 0)
          .map((it) => ({
            item_id: it.item_id,
            ordered_volume: it.ordered_volume,
            unit_price: it.unit_price,
            ppn_percentage: ppn ? 12 : 0,
          }));
      const newId = await createPO(poData, poItems);
      navigate({ to: `/po/${newId}` });
    } finally {
      setSaving(false);
    }
  }

  const itemColumns = [
    {
      key: "item_id", header: "Barang / Material / Jasa Sewa", width: proportional(1.5),
      renderCell: (row: ItemRow) => (
        <Selector
          label="Pilih Katalog"
          isLabelHidden
          value={String(row.item_id)}
          onChange={(v) => updateItem(items.indexOf(row), "item_id", v)}
          options={[
            { value: "0", label: "Pilih katalog..." },
            ...catalogItems.map((m) => ({ value: String(m.item_id), label: `${m.item_name} (${m.unit})` })),
          ]}
        />
      ),
    },
    {
      key: "unit", header: "Satuan", width: pixel(90),
      renderCell: (row: ItemRow) => <Text size="sm">{row.unit}</Text>,
    },
    {
      key: "ordered_volume", header: "Volume Dipesan", width: pixel(115),
      renderCell: (row: ItemRow) => (
      <TextInput label="" value={String(row.ordered_volume)} onChange={(v) => updateItem(items.indexOf(row), "ordered_volume", parseFloat(v) || 0)} />
      ),
    },
    {
      key: "unit_price", header: "Harga Satuan (Rp)", width: pixel(165),
      renderCell: (row: ItemRow) => (
        <TextInput label="" value={String(row.unit_price)} onChange={(v) => updateItem(items.indexOf(row), "unit_price", parseFloat(v) || 0)} />
      ),
    },
    {
      key: "subtotal_item", header: "Subtotal", width: pixel(140),
      renderCell: (row: ItemRow) => <Text size="sm">{formatRupiah(row.ordered_volume * row.unit_price)}</Text>,
    },
    {
      key: "remove", header: "", width: pixel(50),
      renderCell: (row: ItemRow) => (
        <Button size="sm" variant="ghost" label="✕" isDisabled={items.length === 1} onClick={() => removeItem(items.indexOf(row))} />
      ),
    },
  ];

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title={isEdit ? "Edit PO" : "Buat PO Baru"}
          subtitle="Masukkan data kontrak Purchase Order"
          actions={<Button variant="ghost" label="← Kembali" onClick={() => navigate({ to: "/po" })} />}
        />

        <Card padding={4}>
          <VStack gap={3}>
            <Heading level={4}>Informasi PO</Heading>
            <HStack gap={3}>
              <TextInput label="Nomor PO" value={poNumber} onChange={setPoNumber} isRequired width={220} />
              <TextInput label="Tanggal PO" value={poDate} onChange={setPoDate} isRequired width={160} />
            </HStack>
            <HStack gap={3}>
              <Selector
                label="Vendor Pemasok"
                value={vendorId}
                onChange={setVendorId}
                isRequired
                options={[
                  { value: "", label: "Pilih vendor..." },
                  ...vendors.map((v) => ({ value: String(v.vendor_id), label: v.vendor_name })),
                ]}
                width={240}
              />
              <Selector
                label="Proyek Penggunaan"
                value={projectId}
                onChange={setProjectId}
                options={[
                  { value: "", label: "Tidak ditentukan / Kantor" },
                  ...projects.map((p) => ({ value: String(p.project_id), label: p.project_name })),
                ]}
                width={240}
              />
            </HStack>
            <HStack gap={2} align="center">
              <input type="checkbox" checked={ppn} onChange={(e) => setPPN(e.target.checked)} />
              <Text>Tambahkan PPN 12% untuk semua item</Text>
            </HStack>
            <TextArea label="Catatan / Syarat Pengiriman" value={notes} onChange={setNotes} />
          </VStack>
        </Card>

        <Card padding={4}>
          <VStack gap={3}>
            <HStack gap={2} align="center">
              <Heading level={4}>Daftar Item Barang / Alat</Heading>
              <Button size="sm" variant="secondary" label="+ Tambah Item" onClick={addItem} />
            </HStack>
              <Table columns={itemColumns as any} data={items as any} />
            <Divider />
            <HStack gap={4} justify="end">
              <VStack gap={1} align="end">
                <HStack gap={6}><Text color="secondary">Subtotal</Text><Text weight="medium">{formatRupiah(subtotal)}</Text></HStack>
                {ppn && <HStack gap={6}><Text color="secondary">PPN 12%</Text><Text weight="medium">{formatRupiah(ppnAmount)}</Text></HStack>}
                <HStack gap={6}><Text weight="semibold">Total</Text><Heading level={2}>{formatRupiah(total)}</Heading></HStack>
              </VStack>
            </HStack>
          </VStack>
        </Card>

        <HStack gap={2} justify="end">
          <Button variant="ghost" label="Batal" onClick={() => navigate({ to: "/po" })} />
          <Button variant="primary" label="Simpan PO" onClick={handleSave} isLoading={saving} isDisabled={!poNumber || !vendorId} />
        </HStack>
      </VStack>
    </Section>
  );
}


export const Route = createFileRoute('/po/new')({
  component: POFormPage,
});
