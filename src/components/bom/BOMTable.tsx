import { useEffect, useState } from "react";
import { HStack, Button, Table, Text, VStack, Heading, Card } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
    { key: "item_name", header: "Material/Alat", width: proportional(1.5) },
    {
      key: "qty", header: "Volume Rencana", width: pixel(140),
      renderCell: (row: BOMDetail) => `${formatNumber(row.qty, 2)} ${row.unit || ""}`
    },
    {
      key: "estimated_unit_price", header: "Harga Satuan Est.", width: pixel(150),
      renderCell: (row: BOMDetail) => formatRupiah(row.estimated_unit_price)
    },
    {
      key: "total_estimasi", header: "Total Estimasi", width: pixel(160),
      renderCell: (row: BOMDetail) => <Text size="sm" weight="semibold">{formatRupiah(row.total_estimasi || 0)}</Text>,
    },
    ...(stageId ? [{
      key: "actions", header: "", width: pixel(140),
      renderCell: (row: BOMDetail) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => onEdit(row.bom_id, row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget(row.bom_id)} />
        </HStack>
      ),
    }] : []),
  ];

  // Process BOMs: if no stageId (Semua tab), aggregate by item_price_id
  const processedBoms = stageId ? boms : Object.values(boms.reduce((acc, curr) => {
    const key = `${curr.item_price_id}`;
    if (!acc[key]) {
      acc[key] = { ...curr };
    } else {
      acc[key].qty += curr.qty;
      acc[key].total_estimasi = (acc[key].total_estimasi || 0) + (curr.total_estimasi || 0);
    }
    return acc;
  }, {} as Record<string, BOMDetail>));

  const groupedBoms = processedBoms.reduce((acc, curr) => {
    const cat = curr.category || "LAINNYA";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, BOMDetail[]>);

  if (processedBoms.length === 0) {
    return (
      <Card padding={8}>
        <VStack align="center">
          <Text color="secondary">
            Belum ada rencana material di tahap ini. Isi form di bawah untuk mulai menambahkan.
          </Text>
        </VStack>
      </Card>
    );
  }

  const grandTotal = processedBoms.reduce((acc, curr) => acc + (curr.total_estimasi || 0), 0);

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
            <Card padding={0}>
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

      <HStack justify="end" padding={4} style={{ borderTop: "2px solid var(--color-border)", marginTop: 16 }}>
        <Text weight="bold" size="lg">Total Keseluruhan:</Text>
        <Text weight="bold" size="lg" color="primary" style={{ marginLeft: 16, width: 140 }}>
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
