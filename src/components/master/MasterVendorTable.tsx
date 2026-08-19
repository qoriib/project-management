import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HStack, IconButton, Table, Text } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import type { Vendor } from "@/db/repositories";

interface MasterVendorTableProps {
  onEdit: (vendor: Vendor) => void;
}

interface VendorRow extends Vendor, Record<string, unknown> {
  has_relation?: boolean;
}

export function MasterVendorTable({ onEdit }: MasterVendorTableProps) {
  const showToast = useToast(),
    { vendors, deleteVendor } = useMasterStore(),
    [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null),
    [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteVendor(deleteTarget.id);
      showToast({ body: "Vendor berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (error: any) {
      showToast({ body: error.message || "Gagal menghapus vendor", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<VendorRow>[] = [
    {
      header: "Nama Vendor",
      key: "vendor_name",
      width: proportional(1.5),
    },
    {
      align: "end",
      header: "Telepon",
      key: "phone",
      renderCell: (row) => <Text type="code">{row.phone}</Text>,
      width: pixel(150),
    },
    {
      header: "Alamat",
      key: "address",
      width: proportional(2),
    },
    {
      header: "",
      key: "actions",
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
      width: pixel(120),
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
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan jika sudah terikat transaksi.`}
        isLoading={deleting}
      />
    </>
  );
}
