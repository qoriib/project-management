import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import {
  Section, VStack, HStack, Button, Table, Badge, Dialog,
  TextInput, Selector, TextArea, SegmentedControl, SegmentedControlItem, Text, Heading,
} from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getProjects, createProject, updateProject, deleteProject,
  getVendors, createVendor, updateVendor, deleteVendor,
  type Project, type Vendor,
} from "@/db/queries/master";
import { VENDOR_TIPE_OPTIONS, VENDOR_TIPE_LABELS } from "@/utils/formatters";

type Tab = "proyek" | "vendor";

function ProjectsPage() {
  const [tab, setTab] = useState<Tab>("proyek");
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Project | Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form fields - Project
  const [pCode, setPCode] = useState("");
  const [pName, setPName] = useState("");
  const [pContractor, setPContractor] = useState("");
  const [pFiscalYear, setPFiscalYear] = useState("2026");
  const [pStatus, setPStatus] = useState<"ON_PROGRESS" | "COMPLETED" | "SUSPENDED">("ON_PROGRESS");

  // Form fields - Vendor
  const [vName, setVName] = useState("");
  const [vType, setVType] = useState<"MATERIAL_SUPPLIER" | "EQUIPMENT_RENTAL" | "STORE">("MATERIAL_SUPPLIER");
  const [vPhone, setVPhone] = useState("");
  const [vAddress, setVAddress] = useState("");

  async function loadAll() {
    const [ps, vs] = await Promise.all([getProjects(), getVendors()]);
    setProjects(ps);
    setVendors(vs);
  }

  useEffect(() => { loadAll(); }, []);

  function openCreate() {
    setEditItem(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(item: Project | Vendor) {
    setEditItem(item);
    if (tab === "proyek") {
      const p = item as Project;
      setPCode(p.project_code);
      setPName(p.project_name);
      setPContractor(p.contractor_name);
      setPFiscalYear(String(p.fiscal_year));
      setPStatus(p.status);
    } else {
      const v = item as Vendor;
      setVName(v.vendor_name);
      setVType(v.vendor_type);
      setVPhone(v.phone ?? "");
      setVAddress(v.address ?? "");
    }
    setModalOpen(true);
  }

  function resetForm() {
    setPCode(""); setPName(""); setPContractor(""); setPFiscalYear("2026"); setPStatus("ON_PROGRESS");
    setVName(""); setVType("MATERIAL_SUPPLIER"); setVPhone(""); setVAddress("");
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (tab === "proyek") {
        if (editItem) {
          const p = editItem as Project;
          await updateProject(p.project_id, {
            project_code: pCode,
            project_name: pName,
            contractor_name: pContractor,
            fiscal_year: Number(pFiscalYear),
            status: pStatus
          });
        } else {
          await createProject({
            project_code: pCode,
            project_name: pName,
            contractor_name: pContractor,
            fiscal_year: Number(pFiscalYear),
            status: pStatus
          });
        }
      } else {
        if (editItem) {
          const v = editItem as Vendor;
          await updateVendor(v.vendor_id, {
            vendor_name: vName,
            vendor_type: vType,
            phone: vPhone,
            address: vAddress
          });
        } else {
          await createVendor({
            vendor_name: vName,
            vendor_type: vType,
            phone: vPhone,
            address: vAddress
          });
        }
      }
      setModalOpen(false);
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (tab === "proyek") await deleteProject(deleteTarget.id);
      else await deleteVendor(deleteTarget.id);
      setDeleteTarget(null);
      await loadAll();
    } finally {
      setDeleting(false);
    }
  }

  const projectColumns = [
    { key: "project_code", header: "Kode Proyek", width: pixel(120) },
    { key: "project_name", header: "Nama Proyek", width: proportional(1) },
    { key: "contractor_name", header: "Kontraktor", width: proportional(1) },
    { key: "fiscal_year", header: "Tahun Anggaran", width: pixel(120) },
    {
      key: "status", header: "Status", width: pixel(120),
      renderCell: (row: Project) => <Badge variant={row.status === "COMPLETED" ? "success" : "warning"} label={row.status} />,
    },
    {
      key: "actions", header: "", width: pixel(140),
      renderCell: (row: Project) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => openEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget({ id: row.project_id, label: row.project_name })} />
        </HStack>
      ),
    },
  ];

  const vendorColumns = [
    { key: "vendor_name", header: "Nama Vendor", width: proportional(1.5) },
    {
      key: "vendor_type", header: "Tipe Vendor", width: pixel(160),
      renderCell: (row: Vendor) => <Badge variant="neutral" label={VENDOR_TIPE_LABELS[row.vendor_type] ?? row.vendor_type} />,
    },
    { key: "phone", header: "Telepon", width: pixel(140) },
    { key: "address", header: "Alamat", width: proportional(1.5) },
    {
      key: "actions", header: "", width: pixel(140),
      renderCell: (row: Vendor) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => openEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget({ id: row.vendor_id, label: row.vendor_name })} />
        </HStack>
      ),
    },
  ];

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Proyek & Vendor"
          subtitle="Kelola master data proyek dan vendor/pemasok"
          actions={<Button variant="primary" label={"+ Tambah " + (tab === "proyek" ? "Proyek" : "Vendor")} onClick={openCreate} />}
        />

        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          label="Pilih jenis data"
        >
          <SegmentedControlItem value="proyek" label="Proyek" />
          <SegmentedControlItem value="vendor" label="Vendor" />
        </SegmentedControl>

        {tab === "proyek" ? (
          <Table
            columns={projectColumns as any}
            data={projects as any}
            idKey="project_id"
            emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada proyek. Klik "+ Tambah Proyek" untuk menambahkan.</Text></VStack>}
          />
        ) : (
          <Table
            columns={vendorColumns as any}
            data={vendors as any}
            idKey="vendor_id"
            emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada vendor. Klik "+ Tambah Vendor" untuk menambahkan.</Text></VStack>}
          />
        )}
      </VStack>

      {/* Create/Edit Dialog */}
      <Dialog
        isOpen={modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        width={480}
      >
        <VStack gap={3}>
          <Heading level={3}>{editItem ? `Edit ${tab === "proyek" ? "Proyek" : "Vendor"}` : `Tambah ${tab === "proyek" ? "Proyek" : "Vendor"}`}</Heading>
          {tab === "proyek" ? (
            <>
              <TextInput label="Kode Proyek" value={pCode} onChange={setPCode} isRequired />
              <TextInput label="Nama Proyek" value={pName} onChange={setPName} isRequired />
              <TextInput label="Kontraktor" value={pContractor} onChange={setPContractor} isRequired />
              <TextInput label="Tahun Fiskal" value={pFiscalYear} onChange={setPFiscalYear} isRequired />
              <Selector
                label="Status"
                value={pStatus}
                onChange={(v) => setPStatus(v as any)}
                options={[
                  { value: "ON_PROGRESS", label: "Berjalan" },
                  { value: "COMPLETED", label: "Selesai" },
                  { value: "SUSPENDED", label: "Ditunda" },
                ]}
              />
            </>
          ) : (
            <>
              <TextInput label="Nama Vendor" value={vName} onChange={setVName} isRequired />
              <Selector
                label="Tipe Vendor"
                value={vType}
                onChange={(v) => setVType(v as any)}
                options={VENDOR_TIPE_OPTIONS}
              />
              <TextInput label="Telepon" value={vPhone} onChange={setVPhone} />
              <TextArea label="Alamat" value={vAddress} onChange={setVAddress} />
            </>
          )}
          <HStack gap={2} justify="end">
            <Button variant="ghost" label="Batal" onClick={() => setModalOpen(false)} />
            <Button variant="primary" label="Simpan" onClick={handleSave} isLoading={saving} />
          </HStack>
        </VStack>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Hapus ${tab === "proyek" ? "Proyek" : "Vendor"}`}
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan.`}
        isLoading={deleting}
      />
    </Section>
  );
}


export const Route = createFileRoute('/master/projects')({
  component: ProjectsPage,
});
