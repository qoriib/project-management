import { Pencil, Trash2 } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { calcDPP, calcTax, calcLineTotal, TAX_RATIO_PERCENT } from "@/utils/calc";
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
      key: "item_code",
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
      header: `PPn (${TAX_RATIO_PERCENT}%)`,
      key: "has_tax",
      width: pixel(180),
      renderCell: (row) => {
        if (row.isFooter) return null;
        const dpp = calcDPP(row.qty, row.price);
        const taxAmount = calcTax(dpp, row.has_tax);
        return row.has_tax ? (
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
        const dpp = calcDPP(row.qty, row.price);
        const total = calcLineTotal(dpp, row.has_tax);
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
