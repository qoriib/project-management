import { useMemo } from "react";
import { Badge, HStack, IconButton, Text, VStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Eye } from "lucide-react";
import { formatNumber, formatItemCode, type DecimalType } from "@/utils/formatters";
import { EntityCode } from "@/components/shared/EntityCode";
import { ReportComparisonCell, type FinancialStatus } from "@/components/shared/ReportComparisonCell";
import { TAX_RATIO_PERCENT } from "@/utils/calc";
import { type TableColumn, pixel } from "@astryxdesign/core/Table";
import type { RequirementReportItem } from "@/db/services";

export interface EnrichedReportItem extends RequirementReportItem, Record<string, unknown> {
  unique_id: string;
  is_group_footer?: boolean;
}

interface UseReportSummaryColumnsProps {
  onLogClick: (item: RequirementReportItem) => void;
}

interface ComparisonOptions {
  poValue: number;
  plannedValue: number;
  type?: DecimalType;
  highlightUnder?: boolean;
}

/**
 * Helper terpusat untuk merender sel komparasi BOQ vs PO pada baris item biasa.
 * Jika item tidak memiliki BOQ (misalnya item unplanned), menampilkan nilai PO dengan strip pada baris BOQ.
 * Jika item memiliki BOQ, menampilkan ReportComparisonCell (PO vs BOQ).
 */
function renderReportComparison(
  row: EnrichedReportItem,
  { poValue, plannedValue, type = "currency", highlightUnder = false }: ComparisonOptions,
) {
  const hasBoq = !row.is_unplanned && (row.planned_volume > 0 || (row.planned_variants?.length ?? 0) > 0);

  if (!hasBoq) {
    return <ReportComparisonCell poValue={formatNumber(poValue, type)} bomValue="-" />;
  }

  const isOver = poValue > plannedValue && row.total_ordered > 0;
  const isUnder = Boolean(highlightUnder && poValue > 0 && poValue < plannedValue);

  return (
    <ReportComparisonCell
      poValue={formatNumber(poValue, type)}
      bomValue={formatNumber(plannedValue, type)}
      poStatus={isOver ? "over" : isUnder ? "under" : undefined}
    />
  );
}

/**
 * Helper terpusat untuk merender sel komparasi pada baris subtotal footer kelompok.
 * Disederhanakan & konsisten antara kelompok pagu dan non-pagu:
 * - Hanya kolom Total (Rp) yang diwarnai status finansial:
 *   - "over"  (merah) jika PO > BOQ / Pagu
 *   - "under" (hijau) jika PO < BOQ / Pagu (dan PO > 0)
 * - Kolom non-total (Volume, Subtotal, PPn) tidak diberi warna highlight (selalu netral).
 */
function renderFooterComparison(
  row: EnrichedReportItem,
  poValue: number,
  plannedValue: number,
  type: DecimalType = "currency",
  isTotal = false,
) {
  const isPagu = Boolean(row.group_budget && row.group_budget > 0);

  // Untuk kelompok pagu, kolom rincian (volume, subtotal, ppn) tidak memiliki rencana item terpisah
  if (isPagu && !isTotal) {
    return "-";
  }

  let poStatus: FinancialStatus | undefined;
  if (isTotal) {
    if (plannedValue > 0 && poValue > plannedValue) {
      poStatus = "over";
    } else if (plannedValue === 0 && poValue > 0) {
      poStatus = "over";
    } else if (plannedValue > 0 && poValue > 0 && poValue < plannedValue) {
      poStatus = "under";
    }
  }

  return (
    <ReportComparisonCell
      poValue={poValue > 0 ? formatNumber(poValue, type) : "-"}
      bomValue={plannedValue > 0 ? formatNumber(plannedValue, type) : "-"}
      poStatus={poStatus}
    />
  );
}

/**
 * Helper terpusat untuk merender sel metrik numerik komparasi (volume, subtotal, tax, total).
 */
function renderNumericComparisonCell(
  row: EnrichedReportItem,
  poValue: number,
  plannedValue: number,
  type: DecimalType = "currency",
  options?: { isTotal?: boolean; highlightUnderInRow?: boolean },
) {
  if (row.is_group_footer) {
    return renderFooterComparison(row, poValue, plannedValue, type, options?.isTotal);
  }

  if (row.is_empty_group) {
    return <ReportComparisonCell poValue="-" bomValue="-" />;
  }

  return renderReportComparison(row, {
    poValue,
    plannedValue,
    type,
    highlightUnder: options?.highlightUnderInRow,
  });
}

/**
 * Helper terpusat untuk merender progress bar pemenuhan pesanan atau penerimaan.
 */
function renderProgressCell(current: number, target: number) {
  const percent = target > 0 ? (current / target) * 100 : 0;
  const variant = percent > 100 ? "error" : "success";

  return (
    <ProgressBar
      value={current}
      max={target || 1}
      label={`${percent.toFixed(0)}%`}
      hasValueLabel
      formatValueLabel={() => `${formatNumber(current, "volume")} / ${formatNumber(target, "volume")}`}
      variant={variant}
    />
  );
}

export function useReportSummaryColumns({ onLogClick }: UseReportSummaryColumnsProps) {
  return useMemo<TableColumn<EnrichedReportItem>[]>(
    () => [
      {
        header: "Item",
        key: "item",
        width: pixel(280),
        renderCell: (row) => {
          if (row.is_group_footer) {
            return (
              <Text weight="bold" maxLines={1}>
                Subtotal {row.group_name}
              </Text>
            );
          }

          if (row.is_empty_group) {
            return <Text color="secondary">(Belum ada rincian item)</Text>;
          }

          const code = formatItemCode(row);

          return (
            <VStack gap={0.5} align="start">
              <Text weight="medium" maxLines={1}>
                {row.item_name}
              </Text>
              <HStack gap={1.5} align="center">
                <EntityCode size="sm" id={code} />
                {row.unit && <Badge variant="neutral" label={row.unit} />}
              </HStack>
            </VStack>
          );
        },
      },
      {
        header: "",
        key: "row_type",
        width: pixel(50),
        renderCell: (row) => {
          if (row.is_empty_group) return "-";

          return (
            <VStack gap={0.5} align="start">
              <Text type="code" size="sm" weight="bold">
                PO
              </Text>
              <Text type="code" size="sm" weight="bold" color="secondary">
                BOQ
              </Text>
            </VStack>
          );
        },
      },
      {
        align: "end",
        header: "Harga (Rp)",
        key: "price",
        width: pixel(180),
        renderCell: (row) => {
          if (row.is_group_footer || row.is_empty_group) return "-";

          const poPrice = row.total_ordered > 0 ? row.total_order_dpp / row.total_ordered : (row.price ?? 0);
          const plannedPrice = row.planned_volume > 0 ? row.planned_dpp / row.planned_volume : (row.price ?? 0);

          return renderReportComparison(row, {
            poValue: poPrice,
            plannedValue: plannedPrice,
            type: "currency",
            highlightUnder: true,
          });
        },
      },
      {
        align: "end",
        header: "Volume",
        key: "qty",
        width: pixel(140),
        renderCell: (row) => renderNumericComparisonCell(row, row.total_ordered, row.planned_volume, "volume"),
      },
      {
        align: "end",
        header: "Subtotal (Rp)",
        key: "subtotal",
        width: pixel(180),
        renderCell: (row) => renderNumericComparisonCell(row, row.total_order_dpp, row.planned_dpp, "currency"),
      },
      {
        align: "end",
        header: `PPn (${TAX_RATIO_PERCENT}%)`,
        key: "has_tax",
        width: pixel(180),
        renderCell: (row) => renderNumericComparisonCell(row, row.total_order_tax, row.planned_tax, "currency"),
      },
      {
        align: "end",
        header: "Total (Rp)",
        key: "total_price",
        width: pixel(180),
        renderCell: (row) =>
          renderNumericComparisonCell(row, row.total_order_price, row.planned_budget, "currency", {
            isTotal: true,
            highlightUnderInRow: true,
          }),
      },
      {
        align: "end",
        header: "Dipesan (PO)",
        key: "ordered",
        width: pixel(200),
        renderCell: (row) => {
          if (row.is_empty_group || row.is_group_footer) return "-";

          if ((row.group_budget && row.group_budget > 0) || row.is_unplanned) {
            return (
              <Text type="code" color="secondary" weight="medium">
                {formatNumber(row.total_ordered, "volume")}
              </Text>
            );
          }

          return renderProgressCell(row.total_ordered ?? 0, row.planned_volume ?? 0);
        },
      },
      {
        align: "end",
        header: "Diterima (NP)",
        key: "delivered",
        width: pixel(200),
        renderCell: (row) => {
          if (row.is_empty_group || row.is_group_footer) return "-";

          return renderProgressCell(row.total_delivered ?? 0, row.total_ordered ?? 0);
        },
      },
      {
        align: "end",
        header: "Aksi",
        key: "actions",
        width: pixel(80),
        renderCell: (row) => {
          if (row.is_empty_group || row.is_group_footer) return null;

          return (
            <IconButton
              icon={<Eye />}
              variant="secondary"
              onClick={() => onLogClick(row)}
              label="Lihat Rincian & Log"
            />
          );
        },
      },
    ],
    [onLogClick],
  );
}
