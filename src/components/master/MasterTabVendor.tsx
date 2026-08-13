import { useEffect, useState } from "react";
import { Card, Button, Table, Dialog, TextInput, TextArea, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { Banner } from "@astryxdesign/core/Banner";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { vendorRepo, type Vendor } from "@/db/repositories";

export function MasterTabVendor() {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = useToast();

  const [vendorName, setVendorName] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");

  async function loadData() {
    const nextVendors = await vendorRepo.findAllSorted();
    setVendors(nextVendors);
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('openMasterCreate', handleOpen);
    return () => window.removeEventListener('openMasterCreate', handleOpen);
  }, []);

  function openCreate() {
    setVendorName(""); setVendorPhone(""); setVendorAddress("");
    setEditTarget(null);
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  function openEdit(vendor: Vendor) {
    setEditTarget(vendor);
    setVendorName(vendor.vendor_name);
    setVendorPhone(vendor.phone ?? "");
    setVendorAddress(vendor.address ?? "");
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  async function handleSave() {
    setErrorMsg(null);
    setSaving(true);
    try {
      const data = { vendor_name: vendorName, phone: vendorPhone, address: vendorAddress };
      if (editTarget) {
        await vendorRepo.update(editTarget.vendor_id, data);
        showToast({ body: "Vendor berhasil diubah", type: "info" });
      } else {
        await vendorRepo.create(data);
        showToast({ body: "Vendor berhasil ditambahkan", type: "info" });
      }
      setIsDialogOpen(false);
      setEditTarget(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan vendor");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vendorRepo.delete(deleteTarget.id);
      showToast({ body: "Vendor berhasil dihapus", type: "info" });
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus vendor", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "vendor_name", header: "Nama Vendor", width: proportional(1.5) },
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
      <Card padding={0}>
        <Table
          textOverflow="truncate"
          columns={columns as any}
          data={vendors as any}
          idKey="vendor_id"
          emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada vendor.</Text></VStack>}
        />
      </Card>

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={520}>
        <VStack gap={3}>
          <Heading level={3}>{editTarget ? "Edit Vendor" : "Tambah Vendor"}</Heading>

          {errorMsg && <Banner status="error" title="Gagal menyimpan" description={errorMsg} />}

          <TextInput label="Nama Vendor" value={vendorName} onChange={setVendorName} isRequired />
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
