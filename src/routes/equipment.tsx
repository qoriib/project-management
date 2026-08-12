import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import {
  Section, VStack, HStack, Button, Table, Dialog,
  TextInput, Selector, TextArea, Text, Heading,
} from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getEquipmentLogs, createEquipmentLog, deleteEquipmentLog, type EquipmentLog
} from "@/db/queries/field";
import { getProjects, getVendors, type Project, type Vendor } from "@/db/queries/master";
import { formatDate, formatRupiah, formatNumber } from "@/utils/formatters";

function EquipmentLogPage() {
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters
  const [vendorFilter, setVendorFilter] = useState("");
  const [dateDari, setDateDari] = useState("");
  const [dateSampai, setDateSampai] = useState("");

  // Modal Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [pId, setPId] = useState("");
  const [vId, setVId] = useState("");
  const [equipName, setEquipName] = useState("");
  const [operator, setOperator] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [durationVal, setDurationVal] = useState("");
  const [durationUnit, setDurationUnit] = useState("Jam");
  const [ratePerUnit, setRatePerUnit] = useState("");
  const [activity, setActivity] = useState("");

  async function load() {
    const [l, v, p] = await Promise.all([
      getEquipmentLogs({
        vendor_id: vendorFilter ? Number(vendorFilter) : undefined,
        tanggal_dari: dateDari || undefined,
        tanggal_sampai: dateSampai || undefined,
      }),
      getVendors(),
      getProjects(),
    ]);
    setLogs(l);
    setVendors(v.filter((x) => x.vendor_type === "EQUIPMENT_RENTAL" || x.vendor_type === "MATERIAL_SUPPLIER"));
    setProjects(p);
  }

  useEffect(() => { load(); }, [vendorFilter, dateDari, dateSampai]);

  function openCreate() {
    setPId(""); setVId(""); setEquipName(""); setOperator("");
    setDateStart(""); setDateEnd(""); setDurationVal(""); setDurationUnit("Jam");
    setRatePerUnit(""); setActivity("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!equipName || !dateStart || !durationVal || !ratePerUnit) return;
    setSaving(true);
    try {
      await createEquipmentLog({
        project_id: pId ? Number(pId) : undefined,
        vendor_id: vId ? Number(vId) : undefined,
        equipment_name: equipName,
        operator_name: operator,
        work_date_start: dateStart,
        work_date_end: dateEnd || undefined,
        duration_value: parseFloat(durationVal) || 0,
        duration_unit: durationUnit,
        rate_per_unit: parseFloat(ratePerUnit) || 0,
        activity_description: activity,
      });
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEquipmentLog(deleteTarget);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "work_date_start", label: "Tanggal Mulai", width: "120px", render: (v: string) => formatDate(v) },
    { key: "equipment_name", label: "Alat Berat", width: "1fr" },
    { key: "operator_name", label: "Operator", width: "120px" },
    { key: "vendor_name", label: "Penyedia (Vendor)", width: "1fr" },
    {
      key: "duration_value", label: "Durasi", width: "100px",
      render: (v: number, row: EquipmentLog) => `${formatNumber(v, 1)} ${row.duration_unit}`
    },
    { key: "rate_per_unit", label: "Tarif/Unit", width: "140px", render: (v: number) => formatRupiah(v) },
    { key: "total_cost", label: "Total Biaya", width: "140px", render: (v: number) => formatRupiah(v) },
    { key: "activity_description", label: "Kegiatan", width: "1fr" },
    {
      key: "actions", label: "", width: "80px",
      render: (_: unknown, row: EquipmentLog) => (
        <Button size="sm" variant="destructive" label="✕" onClick={() => setDeleteTarget(row.equip_log_id)} />
      ),
    },
  ];

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Log Operasional & Sewa Alat Berat"
          subtitle="Pencatatan harian jam/hari kerja unit excavator, grader, vibro, dll."
          actions={<Button variant="primary" label="+ Tambah Log Alat" onClick={openCreate} />}
        />

        <HStack gap={3}>
          <Selector
            label=""
            placeholder="Semua Penyedia/Vendor"
            value={vendorFilter}
            onChange={setVendorFilter}
            options={[
              { value: "", label: "Semua Penyedia" },
              ...vendors.map((v) => ({ value: String(v.vendor_id), label: v.vendor_name })),
            ]}
            width={240}
          />
          <TextInput label="" value={dateDari} onChange={setDateDari} width={160} />
          <TextInput label="" value={dateSampai} onChange={setDateSampai} width={160} />
        </HStack>

        <Table
          columns={columns as any}
          data={logs as any}
          idKey="equip_log_id"
          emptyState={
            <VStack align="center" padding={8}>
              <Text color="secondary">Belum ada log sewa/pengoperasian alat berat.</Text>
            </VStack>
          }
        />
      </VStack>

      {/* Log Form Dialog */}
      <Dialog
        isOpen={modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        width={500}
      >
        <VStack gap={3}>
          <Heading level={3}>Catat Operasional Alat Berat</Heading>
          <HStack gap={3}>
            <Selector
              label="Proyek"
              value={pId}
              onChange={setPId}
              options={[
                { value: "", label: "Pilih Proyek..." },
                ...projects.map((p) => ({ value: String(p.project_id), label: p.project_name })),
              ]}
              width={220}
            />
            <Selector
              label="Vendor Penyedia Sewa"
              value={vId}
              onChange={setVId}
              options={[
                { value: "", label: "Pilih Vendor..." },
                ...vendors.map((v) => ({ value: String(v.vendor_id), label: v.vendor_name })),
              ]}
              width={220}
            />
          </HStack>

          <HStack gap={3}>
            <TextInput label="Nama Alat Berat" value={equipName} onChange={setEquipName} isRequired width={220} placeholder="Contoh: Excavator Kobelco SK50" />
            <TextInput label="Nama Operator" value={operator} onChange={setOperator} width={220} placeholder="Contoh: Op. Epan" />
          </HStack>

          <HStack gap={3}>
            <TextInput label="Tanggal Mulai" value={dateStart} onChange={setDateStart} isRequired width={220} />
            <TextInput label="Tanggal Selesai (opsional)" value={dateEnd} onChange={setDateEnd} width={220} />
          </HStack>

          <HStack gap={3}>
            <TextInput label="Durasi Kerja" value={durationVal} onChange={setDurationVal} isRequired width={140} />
            <Selector
              label="Satuan Durasi"
              value={durationUnit}
              onChange={setDurationUnit}
              options={[
                { value: "Jam", label: "Jam" },
                { value: "Hari", label: "Hari" },
                { value: "Rit", label: "Rit" },
              ]}
              width={120}
            />
            <TextInput label="Tarif sewa / unit" value={ratePerUnit} onChange={setRatePerUnit} isRequired width={160} />
          </HStack>

          <TextArea label="Deskripsi Kegiatan" value={activity} onChange={setActivity} placeholder="Gali drainase samping, pemadatan bahu jalan STA 10+200..." />

          <HStack gap={2} justify="end">
            <Button variant="ghost" label="Batal" onClick={() => setModalOpen(false)} />
            <Button variant="primary" label="Simpan Log" onClick={handleSave} isLoading={saving} isDisabled={!equipName || !dateStart || !durationVal || !ratePerUnit} />
          </HStack>
        </VStack>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Log Alat Berat"
        message="Apakah Anda yakin ingin menghapus catatan operasional alat berat ini?"
        isLoading={deleting}
      />
    </Section>
  );
}


export const Route = createFileRoute('/equipment')({
  component: EquipmentLogPage,
});
