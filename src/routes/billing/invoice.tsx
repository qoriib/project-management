import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import {
  Section, VStack, HStack, Button, TextInput, Selector, TextArea,
  Card, Heading, Text, Table, Badge, Dialog, Divider,
} from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { getInvoices, createInvoice, addPaymentDirect, type Invoice } from "@/db/queries/billing";
import { getVendors, getProjects, type Vendor, type Project } from "@/db/queries/master";
import { getPOItems, getPurchaseOrders, type POItem } from "@/db/queries/po";
import { getEquipmentLogs, type EquipmentLog } from "@/db/queries/field";
import { formatDate, formatRupiah, STATUS_INVOICE_LABELS, STATUS_INVOICE_COLORS } from "@/utils/formatters";

interface InvoiceItemRow {
  po_item_id?: number;
  equip_log_id?: number;
  description: string;
  amount: number;
}

function InvoiceEntryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters
  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create Invoice Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [invNumber, setInvNumber] = useState("");
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0, 10));
  const [vId, setVId] = useState("");
  const [pId, setPId] = useState("");
  const [ownershipType, setOwnershipType] = useState<"INTERNAL" | "EKSTERNAL">("INTERNAL");
  const [items, setItems] = useState<InvoiceItemRow[]>([]);
  const [catatan, setCatatan] = useState("");

  // Pay Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  // Reference Selector State (For adding items from PO / Equip)
  const [refModalOpen, setRefModalOpen] = useState(false);
  const [refType, setRefType] = useState<"po" | "equip">("po");
  const [availablePOItems, setAvailablePOItems] = useState<POItem[]>([]);
  const [availableEquipLogs, setAvailableEquipLogs] = useState<EquipmentLog[]>([]);

  async function load() {
    const [invs, v, p] = await Promise.all([
      getInvoices({
        vendor_id: vendorFilter ? Number(vendorFilter) : undefined,
        payment_status: statusFilter || undefined,
      }),
      getVendors(),
      getProjects(),
    ]);
    setInvoices(invs);
    setVendors(v);
    setProjects(p);
  }

  useEffect(() => { load(); }, [vendorFilter, statusFilter]);

  // Load available references when vendor is changed in the form
  useEffect(() => {
    if (!vId) return;
    async function loadRefs() {
      // Get all PO items of this vendor
      const pos = await getPurchaseOrders({ vendor_id: Number(vId) });
      const allPOItems: POItem[] = [];
      for (const po of pos) {
        const its = await getPOItems(po.po_id);
        allPOItems.push(...its.map((it) => ({ ...it, item_name: `PO ${po.po_number}: ${it.item_name}` })));
      }
      setAvailablePOItems(allPOItems);

      // Get all equipment logs of this vendor
      const logs = await getEquipmentLogs({ vendor_id: Number(vId) });
      setAvailableEquipLogs(logs);
    }
    loadRefs();
  }, [vId]);

  function openCreate() {
    setInvNumber(""); setInvDate(new Date().toISOString().slice(0, 10));
    setVId(""); setPId(""); setOwnershipType("INTERNAL"); setItems([]); setCatatan("");
    setModalOpen(true);
  }

  function addManualItem() {
    setItems((prev) => [...prev, { description: "Item Manual", amount: 0 }]);
  }

  function addRefPOItem(poItem: POItem) {
    // Auto-calculate suggested amount based on sisa volume or delivered volume
    const vol = poItem.total_terkirim || poItem.ordered_volume;
    const rate = poItem.unit_price;
    const total = vol * rate * (1.0 + poItem.ppn_percentage / 100.0);
    setItems((prev) => [
      ...prev,
      {
        po_item_id: poItem.po_item_id,
        description: `Tagihan ${poItem.item_name} (${vol} ${poItem.unit})`,
        amount: total,
      },
    ]);
    setRefModalOpen(false);
  }

  function addRefEquipLog(log: EquipmentLog) {
    setItems((prev) => [
      ...prev,
      {
        equip_log_id: log.equip_log_id,
        description: `Sewa ${log.equipment_name} - Op. ${log.operator_name || "-"} (${log.duration_value} ${log.duration_unit})`,
        amount: log.total_cost || 0,
      },
    ]);
    setRefModalOpen(false);
  }

  const invoiceTotal = items.reduce((sum, item) => sum + item.amount, 0);

  async function handleSave() {
    if (!invNumber || !vId || items.length === 0) return;
    setSaving(true);
    try {
      await createInvoice({
        project_id: pId ? Number(pId) : undefined,
        vendor_id: Number(vId),
        invoice_number: invNumber,
        invoice_date: invDate,
        total_amount: invoiceTotal,
        paid_amount: 0,
        payment_status: "UNPAID",
        ownership_type: ownershipType,
      }, items);
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  function openPay(inv: Invoice) {
    setPayTarget(inv);
    setPayAmount(String(inv.remaining_balance ?? inv.total_amount));
    setPayModalOpen(true);
  }

  async function handlePaySubmit() {
    if (!payTarget || !payAmount) return;
    setPaying(true);
    try {
      await addPaymentDirect(payTarget.invoice_id, parseFloat(payAmount) || 0);
      setPayModalOpen(false);
      await load();
    } finally {
      setPaying(false);
    }
  }

  const columns = [
    { key: "invoice_number", label: "No. Invoice", width: "160px" },
    { key: "invoice_date", label: "Tanggal", width: "110px", render: (v: string) => formatDate(v) },
    { key: "vendor_name", label: "Vendor", width: "1fr" },
    { key: "project_name", label: "Proyek", width: "1fr" },
    {
      key: "ownership_type", label: "Sifat Biaya", width: "110px",
      render: (v: string) => <Badge variant={v === "INTERNAL" ? "info" : "neutral"} label={v} />
    },
    { key: "total_amount", label: "Total Tagihan", width: "140px", render: (v: number) => formatRupiah(v) },
    { key: "paid_amount", label: "Dibayar", width: "140px", render: (v: number) => formatRupiah(v) },
    { key: "remaining_balance", label: "Sisa Utang", width: "140px", render: (v: number) => formatRupiah(v) },
    {
      key: "payment_status", label: "Status", width: "110px",
      render: (v: string) => (
        <Badge variant={STATUS_INVOICE_COLORS[v as keyof typeof STATUS_INVOICE_COLORS] || "neutral"} label={STATUS_INVOICE_LABELS[v] || v} />
      ),
    },
    {
      key: "actions", label: "", width: "120px",
      render: (_: unknown, row: Invoice) => (
        <HStack gap={1}>
          {row.payment_status !== "PAID" && (
            <Button size="sm" variant="primary" label="Bayar" onClick={() => openPay(row)} />
          )}
        </HStack>
      ),
    },
  ];

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Input & Manajemen Tagihan Vendor"
          subtitle="Pencatatan invoice masuk dari vendor material & alat berat"
          actions={<Button variant="primary" label="+ Catat Invoice Baru" onClick={openCreate} />}
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
          <Selector
            label=""
            placeholder="Semua Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "Semua Status Pembayaran" },
              { value: "UNPAID", label: "Belum Bayar" },
              { value: "PARTIAL", label: "Sebagian" },
              { value: "PAID", label: "Lunas" },
            ]}
            width={200}
          />
        </HStack>

        <Table
          columns={columns as any}
          data={invoices as any}
          idKey="invoice_id"
          emptyState={
            <VStack align="center" padding={8}>
              <Text color="secondary">Tidak ada data tagihan.</Text>
            </VStack>
          }
        />
      </VStack>

      {/* Create Modal */}
      <Dialog
        isOpen={modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        width={720}
      >
        <VStack gap={4}>
          <Heading level={3}>Catat Invoice Vendor</Heading>
          <HStack gap={3}>
            <TextInput label="No. Invoice" value={invNumber} onChange={setInvNumber} isRequired width={200} />
            <TextInput label="Tanggal Invoice" value={invDate} onChange={setInvDate} isRequired width={160} />
            <Selector
              label="Sifat Kepemilikan Biaya"
              value={ownershipType}
              onChange={(v) => setOwnershipType(v as "INTERNAL" | "EKSTERNAL")}
              options={[
                { value: "INTERNAL", label: "INTERNAL (Operasional Kantor)" },
                { value: "EKSTERNAL", label: "EKSTERNAL (Beban Proyek)" },
              ]}
              width={240}
            />
          </HStack>

          <HStack gap={3}>
            <Selector
              label="Pilih Vendor"
              value={vId}
              onChange={setVId}
              isRequired
              options={[
                { value: "", label: "Pilih vendor..." },
                ...vendors.map((v) => ({ value: String(v.vendor_id), label: v.vendor_name })),
              ]}
              width={280}
            />
            <Selector
              label="Pilih Proyek"
              value={pId}
              onChange={setPId}
              options={[
                { value: "", label: "Tidak ditentukan" },
                ...projects.map((p) => ({ value: String(p.project_id), label: p.project_name })),
              ]}
              width={280}
            />
          </HStack>

          {vId && (
            <Card padding={3}>
              <VStack gap={2}>
                <HStack align="center" justify="between">
                  <Text weight="medium">Detail Rincian Tagihan</Text>
                  <HStack gap={2}>
                    <Button size="sm" variant="secondary" label="+ Ambil dari PO" onClick={() => { setRefType("po"); setRefModalOpen(true); }} />
                    <Button size="sm" variant="secondary" label="+ Ambil dari Log Alat" onClick={() => { setRefType("equip"); setRefModalOpen(true); }} />
                    <Button size="sm" variant="secondary" label="+ Rincian Manual" onClick={addManualItem} />
                  </HStack>
                </HStack>

                <Divider />

                {items.length === 0 ? (
                  <Text color="secondary" size="2xs">Klik tombol di atas untuk menambahkan rincian item tagihan.</Text>
                ) : (
                  <VStack gap={2}>
                    {items.map((item, idx) => (
                      <HStack key={idx} gap={3} align="center">
                        <TextInput
                          label=""
                          value={item.description}
                          onChange={(v) => setItems((p) => p.map((x, i) => i === idx ? { ...x, description: v } : x))}
                          style={{ flex: 1 }}
                        />
                        <TextInput
                          label=""
                          value={String(item.amount)}
                          onChange={(v) => setItems((p) => p.map((x, i) => i === idx ? { ...x, amount: parseFloat(v) || 0 } : x))}
                          width={140}
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          label="✕"
                          onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                        />
                      </HStack>
                    ))}
                    <Divider />
                    <HStack justify="end">
                      <Text weight="semibold">Total Rincian: {formatRupiah(invoiceTotal)}</Text>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </Card>
          )}

          <TextArea label="Catatan Tambahan / Keterangan Pembayaran" value={catatan} onChange={setCatatan} />

          <HStack gap={2} justify="end">
            <Button variant="ghost" label="Batal" onClick={() => setModalOpen(false)} />
            <Button variant="primary" label="Simpan Invoice" onClick={handleSave} isLoading={saving} isDisabled={!invNumber || !vId || items.length === 0} />
          </HStack>
        </VStack>
      </Dialog>

      {/* Pay Modal */}
      <Dialog
        isOpen={payModalOpen}
        onOpenChange={(open) => setPayModalOpen(open)}
        width={400}
      >
        <VStack gap={4}>
          <Heading level={3}>Realisasi Pembayaran Tagihan</Heading>
          {payTarget && (
            <VStack gap={1}>
              <Text size="2xs" color="secondary">Membayar tagihan:</Text>
              <Text weight="semibold">{payTarget.invoice_number}</Text>
              <Text size="2xs" color="secondary">Sisa Utang: {formatRupiah(payTarget.remaining_balance)}</Text>
            </VStack>
          )}
          <TextInput
            label="Jumlah Pembayaran (Rp)"
            value={payAmount}
            onChange={setPayAmount}
            isRequired
          />
          <HStack gap={2} justify="end">
            <Button variant="ghost" label="Batal" onClick={() => setPayModalOpen(false)} />
            <Button variant="primary" label="Konfirmasi Pembayaran" onClick={handlePaySubmit} isLoading={paying} />
          </HStack>
        </VStack>
      </Dialog>

      {/* Reference Selector Modal */}
      <Dialog
        isOpen={refModalOpen}
        onOpenChange={(open) => setRefModalOpen(open)}
        width={600}
      >
        <VStack gap={3}>
          <Heading level={3}>{refType === "po" ? "Pilih Item PO Vendor" : "Pilih Log Alat Berat Vendor"}</Heading>
          {refType === "po" ? (
            availablePOItems.length === 0 ? (
              <Text color="secondary" size="sm">Tidak ada item PO yang tersedia untuk vendor ini.</Text>
            ) : (
              availablePOItems.map((poi) => (
                <Card key={poi.po_item_id} padding={3} style={{ cursor: "pointer" }} onClick={() => addRefPOItem(poi)}>
                  <HStack justify="between" align="center">
                    <VStack gap={0.5}>
                      <Text weight="medium" size="sm">{poi.item_name}</Text>
                      <Text size="2xs" color="secondary">Sisa Volume: {poi.sisa} {poi.unit} @ {formatRupiah(poi.unit_price)}</Text>
                    </VStack>
                    <Button size="sm" variant="secondary" label="Pilih" />
                  </HStack>
                </Card>
              ))
            )
          ) : (
            availableEquipLogs.length === 0 ? (
              <Text color="secondary" size="sm">Tidak ada log alat berat yang tersedia untuk vendor ini.</Text>
            ) : (
              availableEquipLogs.map((log) => (
                <Card key={log.equip_log_id} padding={3} style={{ cursor: "pointer" }} onClick={() => addRefEquipLog(log)}>
                  <HStack justify="between" align="center">
                    <VStack gap={0.5}>
                      <Text weight="medium" size="sm">{log.equipment_name}</Text>
                      <Text size="2xs" color="secondary">Durasi: {log.duration_value} {log.duration_unit} · Total: {formatRupiah(log.total_cost)}</Text>
                    </VStack>
                    <Button size="sm" variant="secondary" label="Pilih" />
                  </HStack>
                </Card>
              ))
            )
          )}
          <HStack justify="end">
            <Button variant="ghost" label="Tutup" onClick={() => setRefModalOpen(false)} />
          </HStack>
        </VStack>
      </Dialog>
    </Section>
  );
}


export const Route = createFileRoute('/billing/invoice')({
  component: InvoiceEntryPage,
});
