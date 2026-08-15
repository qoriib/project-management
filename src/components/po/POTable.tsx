import { Pencil, Trash2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { HStack, Table, Text, Badge, IconButton } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { type POWithSummary } from "@/db/repositories";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { formatRupiah, formatDate } from "@/utils/formatters";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/store/useAppStore";
import { usePOStore } from "@/store/usePOStore";

type PORow = POWithSummary & Record<string, unknown>;

interface POTableProps {
  onEdit: (id: number) => void;
}

export function POTable({ onEdit }: POTableProps) {
  const navigate = useNavigate();

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { pos, loadAllPOs, deletePO } = usePOStore();

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
      header: "Kode",
      width: pixel(100),
      renderCell: (row: PORow) => `PO-${String(row.po_id).padStart(4, "0")}`
    },
    {
      key: "po_date",
      header: "Tanggal",
      width: pixel(120),
      renderCell: (row: PORow) => formatDate(row.po_date)
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
      renderCell: (row: PORow) => <Text size="sm" weight="semibold">{formatRupiah(row.total_price)}</Text>,
    },
    {
      key: "actions",
      header: "",
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
            onClick={() => setDeleteTarget({ id: row.po_id, label: `PO-${String(row.po_id).padStart(4, "0")}` })}
          />
        </HStack>
      ),
    },
  ];

  return (
    <>
      <Table
        verticalAlign="top"
        textOverflow="truncate"
        columns={columns}
        data={pos as PORow[]}
        idKey="po_id"
        hasHover
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
