import { useEffect, useState } from "react";
import { HStack, Button, Table, Text, VStack, Heading } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getBOMs, deleteBOM, type BillOfMaterial } from "@/db/queries/bom";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";

interface BOMTableProps {
  stageId?: number;
  refreshTrigger?: number;
  onEdit: (id: number, data: BillOfMaterial) => void;
}

export function BOMTable({ stageId, refreshTrigger, onEdit }: BOMTableProps) {
  const [boms, setBOMs] = useState<BillOfMaterial[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  async function load() {
    if (!selectedProjectId) {
      setBOMs([]);
      return;
    }
    const b = await getBOMs({
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
      await deleteBOM(deleteTarget);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "item_name", header: "Material/Alat", width: proportional(1.5) },
    { 
      key: "planned_volume", header: "Volume Rencana", width: pixel(140),
      renderCell: (row: BillOfMaterial) => `${formatNumber(row.planned_volume, 2)} ${row.unit || ""}`
    },
    { 
      key: "estimated_unit_price", header: "Harga Satuan Est.", width: pixel(150),
      renderCell: (row: BillOfMaterial) => formatRupiah(row.estimated_unit_price)
    },
    {
      key: "total_estimasi", header: "Total Estimasi", width: pixel(160),
      renderCell: (row: BillOfMaterial) => <Text size="sm" weight="semibold">{formatRupiah(row.total_estimasi || 0)}</Text>,
    },
    {
      key: "actions", header: "", width: pixel(140),
      renderCell: (row: BillOfMaterial) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => onEdit(row.bom_id, row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget(row.bom_id)} />
        </HStack>
      ),
    },
  ];

  const groupedBoms = boms.reduce((acc, curr) => {
    const cat = curr.category || "LAINNYA";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, BillOfMaterial[]>);

  if (boms.length === 0) {
    return (
      <VStack align="center" padding={8}>
        <Text color="secondary">
          {!selectedProjectId 
            ? "Pilih Proyek Aktif di menu samping terlebih dahulu."
            : "Belum ada rencana material di tahap ini. Klik '+ Tambah Rincian' untuk memulai."}
        </Text>
      </VStack>
    );
  }

  const grandTotal = boms.reduce((acc, curr) => acc + (curr.total_estimasi || 0), 0);

  return (
    <VStack gap={6}>
      {Object.entries(groupedBoms).map(([category, items]) => {
        const subtotal = items.reduce((acc, curr) => acc + (curr.total_estimasi || 0), 0);
        return (
          <VStack key={category} gap={3}>
            <Heading level={4}>{category}</Heading>
            <Table
              columns={columns as any}
              data={items as any}
              idKey="bom_id"
              hasHover
            />
            <HStack justify="end" style={{ padding: "0 16px" }}>
              <Text weight="semibold">Subtotal {category}:</Text>
              <Text weight="bold" color="primary" style={{ marginLeft: 16, width: 140 }}>
                {formatRupiah(subtotal)}
              </Text>
            </HStack>
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
        title="Hapus Rencana Kebutuhan"
        message="Apakah Anda yakin ingin menghapus material ini dari rencana (BOM)?"
        isLoading={deleting}
      />
    </VStack>
  );
}
