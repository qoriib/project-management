import { Pencil, Trash2 } from "lucide-react";
import { Badge, HStack, IconButton, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { calcDPP, calcTax, calcLineTotal, TAX_RATIO_PERCENT } from "@/utils/calc";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { RequirementDetail } from "@/db/repositories";

export type RequirementRow = RequirementDetail & {
  is_empty_group?: boolean;
  is_pagu_account?: boolean;
  is_group_footer?: boolean;
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

/**
 * Helper guard: merender sel yang hanya aktif pada item BOQ biasa.
 * Untuk baris pagu dan empty group, mengembalikan "-".
 * Untuk baris footer, menjalankan renderFooter jika ada, atau "-".
 */
function withBoqItemOnly(
  row: RequirementRow,
  renderNormal: () => React.ReactNode,
  renderFooter?: () => React.ReactNode,
) {
  if (row.is_group_footer) return renderFooter ? renderFooter() : "-";
  if (row.is_empty_group || row.is_pagu_account) return "-";
  return renderNormal();
}

export function useRequirementColumns({ onEdit, setDeletingId, isApproved }: UseRequirementColumnsProps) {
  const baseColumns: TableColumn<RequirementRow>[] = [
    {
      header: "Kode Item",
      key: "item_code",
      width: pixel(140),
      renderCell: (row) => {
        if (row.is_group_footer || row.is_empty_group) return null;
        if (row.is_pagu_account) return <Badge variant="warning" label="Pagu" />;
        const code = formatItemCode(row);
        return <EntityCode id={code} />;
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(1, { minWidth: 280 }),
      renderCell: (row) => {
        if (row.is_group_footer) return <Text weight="bold">Subtotal {row.group_name}</Text>;
        if (row.is_empty_group) return <Text color="secondary">(Belum ada rincian item)</Text>;
        if (row.is_pagu_account) return row.item_name ? <Text weight="bold">{row.item_name}</Text> : "-";
        return row.item_name ? <Text weight="medium">{row.item_name}</Text> : "-";
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => (row.is_empty_group || row.is_group_footer || row.is_pagu_account ? "-" : row.unit || "-"),
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(140),
      renderCell: (row) =>
        withBoqItemOnly(
          row,
          () => <Text type="code">{formatNumber(row.qty, "volume")}</Text>,
          () => (
            <Text type="code" weight="bold">
              {formatNumber(row.subtotal_volume ?? 0, "volume")}
            </Text>
          ),
        ),
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(180),
      renderCell: (row) => withBoqItemOnly(row, () => <Text type="code">{formatNumber(row.price, "currency")}</Text>),
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (row) =>
        withBoqItemOnly(
          row,
          () => <Text type="code">{formatNumber((row.qty ?? 0) * (row.price ?? 0), "currency")}</Text>,
          () => (
            <Text type="code" weight="bold">
              {formatNumber(row.subtotal_dpp ?? 0, "currency")}
            </Text>
          ),
        ),
    },
    {
      align: "end",
      header: `PPn (${TAX_RATIO_PERCENT}%)`,
      key: "has_tax",
      width: pixel(180),
      renderCell: (row) =>
        withBoqItemOnly(
          row,
          () => {
            const dpp = calcDPP(row.qty, row.price);
            const taxAmount = calcTax(dpp, row.has_tax);
            return row.has_tax ? <Text type="code">{formatNumber(taxAmount, "currency")}</Text> : "-";
          },
          () =>
            (row.subtotal_tax ?? 0) > 0 ? (
              <Text type="code" weight="bold">
                {formatNumber(row.subtotal_tax ?? 0, "currency")}
              </Text>
            ) : (
              "-"
            ),
        ),
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total",
      width: pixel(180),
      renderCell: (row) => {
        if (row.is_group_footer) {
          return (
            <Text type="code" weight="bold" color="primary">
              {formatNumber(row.subtotal_total ?? 0, "currency")}
            </Text>
          );
        }
        if (row.is_empty_group) return null;
        if (row.is_pagu_account) {
          return row.price && row.price > 0 ? (
            <Text type="code" weight="bold">
              {formatNumber(row.price, "currency")}
            </Text>
          ) : (
            <Text color="secondary">(Tanpa Budget)</Text>
          );
        }
        const total = calcLineTotal(calcDPP(row.qty, row.price), row.has_tax);
        return (
          <Text type="code" weight="bold">
            {formatNumber(total, "currency")}
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
        if (isApproved || row.is_group_footer || row.is_empty_group || row.is_pagu_account) return null;

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
