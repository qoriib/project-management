import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { HStack, Table, Text, IconButton, Divider } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn, useTableGroupedRows } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { type BOMDetail } from "@/db/repositories";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import { useBOMStore } from "@/store/useBOMStore";

type BomRow = BOMDetail & Record<string, unknown>;

interface BOMTableProps {
  refreshTrigger?: number;
  onEdit: (id: string, data: BOMDetail) => void;
}

export function BOMTable({ refreshTrigger, onEdit }: BOMTableProps) {
  const { boms, deleteBOM, loadBOMs } = useBOMStore();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  useEffect(() => {
    if (selectedProjectId) {
      loadBOMs(selectedProjectId);
    }
  }, [refreshTrigger, selectedProjectId]);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteBOM(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<BomRow>[] = [
    {
      key: "item_id",
      header: "No. Barang",
      width: pixel(120),
      renderCell: (row: BomRow) => <EntityCode prefix="BRG" id={row.item_id} />
    },
    {
      key: "item_name",
      header: "Nama Item",
      width: proportional(1)
    },
    {
      key: "qty",
      header: "Volume Rencana",
      width: pixel(140),
      renderCell: (row: BomRow) => `${formatNumber(row.qty, 2)} ${row.unit || ""}`
    },
    {
      key: "price",
      header: "Harga Rencana",
      width: pixel(160),
      renderCell: (row: BomRow) => formatRupiah(row.price)
    },
    {
      key: "estimation",
      header: "Total Estimasi",
      width: pixel(180),
      renderCell: (row: BomRow) => formatRupiah(row.estimated_total || 0),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "end",
      width: pixel(100),
      renderCell: (row: BomRow) => (
        <HStack gap={2} justify="end">
          <IconButton
            size="sm"
            variant="secondary"
            label="Edit"
            icon={<Pencil size={16} />}
            onClick={() => onEdit(row.bom_id, row)}
          />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteTarget(row.bom_id)}
          />
        </HStack>
      ),
    },
  ];

  const { grandTotal, categorySubtotals } = useMemo(() => {
    let grand = 0;
    const subtotals: Record<string, number> = {};
    for (const b of boms) {
      const cat = b.bom_group_name || "LAINNYA";
      const total = b.estimated_total || 0;
      grand += total;
      subtotals[cat] = (subtotals[cat] || 0) + total;
    }
    return { grandTotal: grand, categorySubtotals: subtotals };
  }, [boms]);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { data: groupedData, plugin: groupedPlugin, idKey: groupedIdKey } = useTableGroupedRows({
    data: boms as BomRow[],
    groupBy: (item) => item.bom_group_name || "LAINNYA",
    collapsedGroups,
    onToggleGroup: (key) => {
      setCollapsedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    getRowKey: (item) => String(item.bom_id),
    renderGroupHeader: (key) => (
      <HStack justify="between" align="center" paddingInline={1} width="100%">
        <Text weight="bold">{key}</Text>
        <Text weight="bold">{formatRupiah(categorySubtotals[key] || 0)}</Text>
      </HStack>
    ),
  });

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={groupedData}
        idKey={groupedIdKey}
        plugins={{ grouping: groupedPlugin }}
        emptyState={<TableEmptyState message="Belum ada rencana material di proyek ini. Isi form di bawah untuk mulai menambahkan." />}
      />
      {boms.length > 0 && (
        <>
          <Divider />
          <HStack justify="end" gap={2}>
            <Text weight="bold" size="lg">Total:</Text>
            <Text weight="bold" size="lg" color="primary">
              {formatRupiah(grandTotal)}
            </Text>
          </HStack>
        </>
      )}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kebutuhan"
        message="Apakah Anda yakin ingin menghapus material ini dari rencana (BOM)?"
        isLoading={deleting}
      />
    </>
  );
}
