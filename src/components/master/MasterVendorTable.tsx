import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Table, HStack, IconButton, Text } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import type { Vendor } from "@/db/repositories";


interface MasterVendorTableProps {
  onEdit: (vendor: Vendor) => void;
}

type VendorRow = Vendor & Record<string, unknown> & { has_relation?: boolean };

export function MasterVendorTable({ onEdit }: MasterVendorTableProps) {
  const showToast = useToast();

  const { vendors, deleteVendor } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const columns: TableColumn<VendorRow>[] = [

    {
      key: "vendor_name",
      header: "Nama Vendor",
      width: proportional(1.5)
    },
    {
      key: "phone",
      header: "Telepon",
      width: pixel(150),
      align: "end",
      renderCell: (row) => <Text type="code">{row.phone}</Text>
    },
    {
      key: "address",
      header: "Alamat",
      width: proportional(2)
    },
    {
      key: "actions",
      header: "",
      width: pixel(120),
      renderCell: (row: VendorRow) => (
        <HStack gap={2} justify="end">
          <IconButton
            size="sm"
            variant="secondary"
            label="Edit"
            icon={<Pencil size={16} />}
            onClick={() => onEdit(row)}
          />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteTarget({ id: row.vendor_id, label: row.vendor_name })}
            isDisabled={row.has_relation}
          />
        </HStack>
      ),
    },
  ];

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={vendors as VendorRow[]}
        idKey="vendor_id"
        emptyState={<TableEmptyState message="Belum ada vendor." />}
      />
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
