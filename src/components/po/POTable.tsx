import { Pencil, Trash2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { HStack, Table, Badge, IconButton, Timestamp } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { formatRupiah } from "@/utils/formatters";
import { EntityCode, formatEntityCode } from "@/components/shared/EntityCode";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/store/useAppStore";
import { usePOStore } from "@/store/usePOStore";
import { type POWithSummary } from "@/db/repositories";

type PORow = POWithSummary & Record<string, unknown>;

interface POTableProps {
  onEdit: (id: number) => void;
}

export function POTable({ onEdit }: POTableProps) {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const { pos, loadAllPOs, deletePO } = usePOStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAllPOs(selectedProjectId || undefined);
  }, [selectedProjectId, loadAllPOs]);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deletePO(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<PORow>[] = [
    {
      key: "po_id",
      header: "No. PO",
      width: pixel(120),
      renderCell: (row: PORow) => <EntityCode prefix="PO" id={row.po_id} />
    },
    {
      key: "po_date",
      header: "Tanggal",
      width: pixel(120),
      renderCell: (row: PORow) => <Timestamp value={row.po_date} format="system_date" size="base" />
    },
    {
      key: "vendor_names",
      header: "Vendor Pemasok",
      width: proportional(1),
      renderCell: (row: PORow) => row.vendor_names ? (
        <HStack gap={1} style={{ flexWrap: 'wrap' }}>
          {row.vendor_names.split(",").map((v, idx) => (
            <Badge key={idx} variant="neutral" label={v.trim()} />
          ))}
        </HStack>
      ) : "—"
    },
    {
      key: "item_count",
      header: "Total Item",
      width: pixel(140),
      renderCell: (row: PORow) => `${row.item_count} Item`
    },
    {
      key: "total_price",
      header: "Total Biaya",
      width: pixel(200),
      renderCell: (row: PORow) => formatRupiah(row.total_price),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "end",
      width: pixel(140),
      renderCell: (row: PORow) => (
        <HStack gap={2} justify="end">
          <IconButton
            size="sm"
            variant="secondary"
            label="Detail"
            icon={<Eye size={16} />}
            onClick={() => navigate({ to: `/po/${row.po_id}` })}
          />
          <IconButton
            size="sm"
            variant="secondary"
            label="Edit"
            icon={<Pencil size={16} />}
            onClick={() => onEdit(row.po_id)}
          />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteTarget({ id: row.po_id, label: formatEntityCode("PO", row.po_id) })}
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
        data={pos as PORow[]}
        idKey="po_id"
        emptyState={<TableEmptyState message="Belum ada PO. Klik 'Buat Baru' untuk memulai." />}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus PO"
        message={`Hapus PO "${deleteTarget?.label}"? Semua item dan pengiriman terkait akan ikut terhapus.`}
        isLoading={deleting}
      />
    </>
  );
}
