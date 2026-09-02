import { Pencil, Trash2 } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { RequirementDetail } from "@/db/repositories";

export interface RequirementRow extends RequirementDetail, Record<string, unknown> {
  isFooter?: boolean;
}

interface UseRequirementColumnsProps {
  onEdit: (item: RequirementDetail) => void;
  setDeletingId: (id: string | null) => void;
  isApproved: boolean;
}

export function useRequirementColumns({ onEdit, setDeletingId, isApproved }: UseRequirementColumnsProps) {
  const baseColumns: TableColumn<RequirementRow>[] = [
    {
      header: "Kode Item",
      key: "item_code_full",
      width: pixel(140),
      renderCell: (row) => {
        if (row.isFooter) return null;
        const code = formatItemCode(row);
        return code ? <EntityCode id={code} /> : "-";
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(1, { minWidth: 280 }),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return row.item_name || "-";
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return row.unit || "-";
      },
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(140),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return (
          <Text type="code" weight="medium">
            {formatNumber(row.qty)}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(180),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return <Text type="code">{formatNumber(row.price)}</Text>;
      },
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (row) => {
        if (row.isFooter) return null;
        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        return <Text type="code">{formatNumber(subtotal)}</Text>;
      },
    },
    {
      align: "end",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(180),
      renderCell: (row) => {
        if (row.isFooter) return null;
        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        const taxAmount = row.has_tax === 1 ? subtotal * 0.12 : 0;
        return row.has_tax === 1 ? (
          <Text type="code">{formatNumber(taxAmount)}</Text>
        ) : (
          <Text size="sm" color="secondary">
            -
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total",
      width: pixel(180),
      renderCell: (row) => {
        if (row.isFooter) return null;
        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        const total = row.has_tax === 1 ? subtotal * 1.12 : subtotal;
        return (
          <Text type="code" weight="bold">
            {formatNumber(total)}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(120),
      renderCell: (row) => {
        if (row.isFooter) return null;
        if (isApproved) return null;

        return (
          <HStack gap={2} justify="end">
            <IconButton size="sm" variant="secondary" label="Edit" icon={<Pencil />} onClick={() => onEdit(row)} />
            <IconButton
              size="sm"
              variant="destructive"
              label="Hapus"
              icon={<Trash2 />}
              onClick={() => setDeletingId(row.requirement_id)}
            />
          </HStack>
        );
      },
    },
  ];

  return isApproved ? baseColumns.slice(0, -1) : baseColumns;
}
