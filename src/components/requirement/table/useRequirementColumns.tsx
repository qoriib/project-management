import { Pencil, Trash2 } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { calcDPP, calcTax, calcLineTotal, TAX_RATIO_PERCENT } from "@/utils/calc";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { RequirementDetail } from "@/db/repositories";

export type RequirementRow = RequirementDetail & {
  is_empty_group?: boolean;
  is_pagu_account?: boolean;
  is_group_subtotal?: boolean;
  subtotal_volume?: number;
  subtotal_dpp?: number;
  subtotal_tax?: number;
  subtotal_total?: number;
} & Record<string, unknown>;

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
        if (row.is_group_subtotal || row.is_empty_group) {
          return null;
        }
        if (row.is_pagu_account) {
          return (
            <Text size="sm" color="secondary">
              -
            </Text>
          );
        }
        const code = formatItemCode(row);
        return code ? <EntityCode id={code} /> : "-";
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(1, { minWidth: 280 }),
      renderCell: (row) => {
        if (row.is_group_subtotal) {
          return <Text weight="bold">Subtotal {row.group_name}</Text>;
        }
        if (row.is_empty_group) {
          return null;
        }
        if (row.is_pagu_account) {
          return <Text weight="medium">Pagu Anggaran (Rekening)</Text>;
        }
        return row.item_name || "-";
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => (row.is_empty_group || row.is_group_subtotal ? "-" : row.unit || "-"),
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(140),
      renderCell: (row) => {
        if (row.is_group_subtotal) {
          return (
            <Text type="code" weight="bold">
              {formatNumber(row.subtotal_volume ?? 0, 5)}
            </Text>
          );
        }
        if (row.is_empty_group) {
          return null;
        }
        if (row.is_pagu_account) {
          return (
            <Text size="sm" color="secondary">
              1
            </Text>
          );
        }
        return (
          <Text type="code" weight="medium">
            {formatNumber(row.qty, 5)}
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
        if (row.is_empty_group || row.is_group_subtotal) {
          return (
            <Text size="sm" color="secondary">
              -
            </Text>
          );
        }
        return <Text type="code">{formatNumber(row.price, 2)}</Text>;
      },
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (row) => {
        if (row.is_group_subtotal) {
          return (
            <Text type="code" weight="bold">
              {formatNumber(row.subtotal_dpp ?? 0, 2)}
            </Text>
          );
        }
        if (row.is_empty_group) {
          return null;
        }
        const subtotal = row.is_pagu_account ? row.price : (row.qty ?? 0) * (row.price ?? 0);
        return <Text type="code">{formatNumber(subtotal, 2)}</Text>;
      },
    },
    {
      align: "end",
      header: `PPn (${TAX_RATIO_PERCENT}%)`,
      key: "has_tax",
      width: pixel(180),
      renderCell: (row) => {
        if (row.is_group_subtotal) {
          return (row.subtotal_tax ?? 0) > 0 ? (
            <Text type="code" weight="bold">
              {formatNumber(row.subtotal_tax ?? 0, 2)}
            </Text>
          ) : (
            <Text size="sm" color="secondary">
              -
            </Text>
          );
        }
        if (row.is_empty_group || row.is_pagu_account) {
          return (
            <Text size="sm" color="secondary">
              -
            </Text>
          );
        }
        const dpp = calcDPP(row.qty, row.price);
        const taxAmount = calcTax(dpp, row.has_tax);
        return row.has_tax ? (
          <Text type="code">{formatNumber(taxAmount, 2)}</Text>
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
        if (row.is_group_subtotal) {
          return (
            <Text type="code" weight="bold" color="primary">
              {formatNumber(row.subtotal_total ?? 0, 2)}
            </Text>
          );
        }
        if (row.is_empty_group) {
          return null;
        }
        if (row.is_pagu_account) {
          return (
            <Text type="code" weight="bold">
              {formatNumber(row.price, 2)}
            </Text>
          );
        }
        const dpp = calcDPP(row.qty, row.price);
        const total = calcLineTotal(dpp, row.has_tax);
        return (
          <Text type="code" weight="bold">
            {formatNumber(total, 2)}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(140),
      renderCell: (row) => {
        if (isApproved || row.is_group_subtotal || row.is_empty_group) return null;

        if (row.is_pagu_account) {
          return (
            <Text size="sm" color="secondary">
              -
            </Text>
          );
        }

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
