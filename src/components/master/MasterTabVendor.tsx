import { useEffect, useState } from "react";
import { Button, Table, Badge, Dialog, TextInput, Selector, TextArea, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getVendors, createVendor, updateVendor, deleteVendor,
  type Vendor,
} from "@/db/queries/master";
import { VENDOR_TIPE_LABELS, VENDOR_TIPE_OPTIONS } from "@/utils/formatters";

type VendorType = Vendor["vendor_type"];

export function MasterTabVendor() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [vendorName, setVendorName] = useState("");
  const [vendorType, setVendorType] = useState<VendorType>("MATERIAL_SUPPLIER");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");

  async function loadData() {
    const nextVendors = await getVendors();
    setVendors(nextVendors);
  }

  useEffect(() => { loadData(); }, []);

  function openCreate() {
    setVendorName(""); setVendorType("MATERIAL_SUPPLIER"); setVendorPhone(""); setVendorAddress("");
    setEditTarget(null);
    setIsDialogOpen(true);
  }

  function openEdit(vendor: Vendor) {
    setEditTarget(vendor);
    setVendorName(vendor.vendor_name);
    setVendorType(vendor.vendor_type);
    setVendorPhone(vendor.phone ?? "");
    setVendorAddress(vendor.address ?? "");
    setIsDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = { vendor_name: vendorName, vendor_type: vendorType, phone: vendorPhone, address: vendorAddress };
      if (editTarget) {
        await updateVendor(editTarget.vendor_id, data);
      } else {
        await createVendor(data);
      }
      setIsDialogOpen(false);
      setEditTarget(null);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "vendor_name", header: "Nama Vendor", width: proportional(1.5) },
    {
      key: "vendor_type", header: "Tipe", width: pixel(180),
      renderCell: (row: Vendor) => <Badge variant="neutral" label={VENDOR_TIPE_LABELS[row.vendor_type] ?? row.vendor_type} />,
    },
    { key: "phone", header: "Telepon", width: pixel(150) },
    { key: "address", header: "Alamat", width: proportional(1.5) },
    {
      key: "actions", header: "", width: pixel(150),
      renderCell: (row: Vendor) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => openEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget({ id: row.vendor_id, label: row.vendor_name })} />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={4}>
      <HStack justify="end">
        <Button variant="primary" label="+ Tambah Vendor" onClick={openCreate} />
      </HStack>
      <Table
        columns={columns as any}
        data={vendors as any}
        idKey="vendor_id"
        emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada vendor.</Text></VStack>}
      />

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={520}>
        <VStack gap={3}>
          <Heading level={3}>{editTarget ? "Edit Vendor" : "Tambah Vendor"}</Heading>
          <TextInput label="Nama Vendor" value={vendorName} onChange={setVendorName} isRequired />
          <Selector label="Tipe Vendor" value={vendorType} onChange={(value) => setVendorType(value as VendorType)} options={VENDOR_TIPE_OPTIONS} />
          <TextInput label="Telepon" value={vendorPhone} onChange={setVendorPhone} />
          <TextArea label="Alamat" value={vendorAddress} onChange={setVendorAddress} />
          
          <HStack gap={2} justify="end">
            <Button variant="ghost" label="Batal" onClick={() => setIsDialogOpen(false)} />
            <Button variant="primary" label="Simpan" onClick={handleSave} isLoading={saving} />
          </HStack>
        </VStack>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan jika sudah terikat transaksi.`}
        isLoading={deleting}
      />
    </VStack>
  );
}
