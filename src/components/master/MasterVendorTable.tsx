import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState, HStack, IconButton, Table } from "@astryxdesign/core";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { handleFormError } from "@/utils/form";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
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
      width: proportional(1.5, { minWidth: 240 }),
      renderCell: (row: VendorRow) => row.vendor_name || "-",
    },
    {
      header: "Telepon",
      key: "phone",
      width: pixel(140),
      renderCell: (row: VendorRow) => row.phone || "-",
    },
    {
      header: "Alamat",
      key: "address",
      width: proportional(2, { minWidth: 280 }),
      renderCell: (row: VendorRow) => row.address || "-",
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(120),
      renderCell: (row: VendorRow) => (
        <HStack gap={2} justify="end">
          <IconButton size="sm" variant="secondary" label="Edit" icon={<Pencil />} onClick={() => onEdit(row)} />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 />}
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
        emptyState={<EmptyState isCompact title="Belum ada vendor" />}
      />
      <AlertDialog
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onAction={handleDelete}
        title="Hapus Vendor"
        description={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak dapat dibatalkan.`}
        actionLabel="Hapus"
        cancelLabel="Batal"
        isActionLoading={deleting}
      />
    </>
  );
}
