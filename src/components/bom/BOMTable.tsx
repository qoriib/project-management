import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { HStack, Table, Text, VStack, Heading, Card, IconButton, Divider } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { bomRepo, type BOMDetail } from "@/db/repositories";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";

interface BOMTableProps {
  stageId?: number;
  refreshTrigger?: number;
  onEdit: (id: number, data: BOMDetail) => void;
}

export function BOMTable({ stageId, refreshTrigger, onEdit }: BOMTableProps) {
  const [boms, setBOMs] = useState<BOMDetail[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  async function load() {
    if (!selectedProjectId) {
      setBOMs([]);
      return;
    }
    const b = await bomRepo.findAllWithDetails({
      project_id: selectedProjectId,
      stage_id: stageId,
    });
    setBOMs(b);
  }

  useEffect(() => { load(); }, [refreshTrigger, selectedProjectId, stageId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await bomRepo.delete(deleteTarget);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "item_id",
      header: "Kode",
      width: pixel(100),
      renderCell: (row: BOMDetail) => `BRG-${String(row.item_id).padStart(4, '0')}`
    },
    {
      key: "item_name",
      header: "Item",
      width: proportional(1)
    },
    {
      key: "qty",
      header: "Volume Rencana",
      width: pixel(140),
      renderCell: (row: BOMDetail) => `${formatNumber(row.qty, 2)} ${row.unit || ""}`
    },
    {
      key: "price",
      header: "Harga Rencana",
      width: pixel(160),
      renderCell: (row: BOMDetail) => formatRupiah(row.price)
    },
    {
      key: "total_estimasi",
      header: "Total Estimasi",
      width: pixel(180),
      renderCell: (row: BOMDetail) => formatRupiah(row.total_estimasi || 0),
    },
    {
      key: "actions", header: "", width: pixel(100),
      renderCell: (row: BOMDetail) => (
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

  const groupedBoms = boms.reduce((acc, curr) => {
    const cat = curr.category || "LAINNYA";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, BOMDetail[]>);

  if (boms.length === 0) {
    return (
      <Card>
        <Table
          columns={columns as any}
          data={[]}
          idKey="bom_id"
          emptyState={<TableEmptyState message="Belum ada rencana material di tahap ini. Isi form di bawah untuk mulai menambahkan." />}
        />
      </Card>
    );
  }

  const grandTotal = boms.reduce((acc, curr) => acc + (curr.total_estimasi || 0), 0);

  return (
    <VStack gap={6}>
      {Object.entries(groupedBoms).map(([category, items]) => {
        const subtotal = items.reduce((acc, curr) => acc + (curr.total_estimasi || 0), 0);
        return (
          <VStack key={category} gap={3}>
            <HStack justify="between" align="center">
              <Heading level={4}>{category}</Heading>
              <Text weight="bold" color="primary">{formatRupiah(subtotal)}</Text>
            </HStack>
            <Card>
              <Table
                columns={columns as any}
                data={items as any}
                idKey="bom_id"
                hasHover
              />
            </Card>
          </VStack>
        );
      })}
      <Divider />
      <HStack justify="end" gap={2}>
        <Text weight="bold" size="lg">Total:</Text>
        <Text weight="bold" size="lg" color="primary">
          {formatRupiah(grandTotal)}
        </Text>
      </HStack>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kebutuhan"
        message="Apakah Anda yakin ingin menghapus material ini dari rencana (BOM)?"
        isLoading={deleting}
      />
    </VStack>
  );
}
