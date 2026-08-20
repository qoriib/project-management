import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HStack, IconButton, Table } from "@astryxdesign/core";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { handleFormError } from "@/utils/form";
import { type TableColumn, pixel, proportional, useTableRowIndex } from "@astryxdesign/core/Table";
import type { Vendor } from "@/db/repositories";

interface MasterVendorTableProps {
  onEdit: (vendor: Vendor) => void;
}

interface VendorRow extends Vendor, Record<string, unknown> {
  has_relation?: boolean;
}

export function MasterVendorTable({ onEdit }: MasterVendorTableProps) {
  const showToast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { vendors, deleteVendor } = useMasterStore();

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteVendor(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error: any) {
      handleFormError(error, showToast);
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
      header: "Telepon",
      key: "phone",
      width: pixel(150),
    },
    {
      header: "Alamat",
      key: "address",
      width: proportional(2),
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
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

  const rowIndexPlugin = useTableRowIndex({
    data: vendors as VendorRow[],
    getRowKey: (item) => item.vendor_id,
    label: "No.",
  });

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={vendors as VendorRow[]}
        idKey="vendor_id"
        plugins={{ rowIndex: rowIndexPlugin }}
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
