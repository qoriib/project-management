import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, Table, HStack, Text, VStack, IconButton } from "@astryxdesign/core";
import { proportional } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@astryxdesign/core/Toast";
import type { Vendor } from "@/db/repositories";
import { useMasterStore } from "@/store/useMasterStore";

interface MasterVendorTableProps {
  onEdit: (vendor: Vendor) => void;
}

export function MasterVendorTable({ onEdit }: MasterVendorTableProps) {
  const { vendors, deleteVendor } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const showToast = useToast();

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteTarget.id);
      showToast({ body: "Vendor berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus vendor", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "vendor_name", header: "Nama Vendor", width: proportional(1.5) },
    { key: "phone", header: "Telepon", width: proportional(1) },
    { key: "address", header: "Alamat", width: proportional(1.5) },
    {
      key: "actions", header: "", width: proportional(1),
      renderCell: (row: Vendor) => (
        <HStack gap={1}>
          <IconButton size="sm" variant="secondary"  icon={<Pencil size={16} />} label="Edit"  onClick={() => onEdit(row)} />
          <IconButton size="sm" variant="destructive"  icon={<Trash2 size={16} />} label="Hapus"  onClick={() => setDeleteTarget({ id: row.vendor_id, label: row.vendor_name })} />
        </HStack>
      ),
    },
  ];

  return (
    <>
      <Card padding={0}>
        <Table
          textOverflow="truncate"
          columns={columns as any}
          data={vendors as any}
          idKey="vendor_id"
          emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada vendor.</Text></VStack>}
        />
      </Card>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan jika sudah terikat transaksi.`}
        isLoading={deleting}
      />
    </>
  );
}
