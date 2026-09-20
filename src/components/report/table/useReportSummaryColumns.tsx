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
import { isUnplannedItem } from "./reportSummaryTableUtils";

export interface EnrichedReportItem extends RequirementReportItem, Record<string, unknown> {
  unique_id: string;
  is_group_footer?: boolean;
}

interface UseReportSummaryColumnsProps {
  onLogClick: (item: RequirementReportItem) => void;
}

interface ComparisonOptions {
  npValue: number;
  poValue: number;
  plannedValue: number;
  type?: DecimalType;
  highlightUnder?: boolean;
}

/**
 * Helper terpusat untuk merender sel komparasi NP, PO, BOQ pada baris item biasa.
 * - Baris 1: NP (Penerimaan) -> deviasi dihitung terhadap PO
 * - Baris 2: PO (Pesanan)    -> deviasi dihitung terhadap BOQ
 * - Baris 3: BOQ (Rencana)   -> baseline netral
 */
function renderReportComparison(
  row: EnrichedReportItem,
  { npValue, poValue, plannedValue, type = "currency", highlightUnder = false }: ComparisonOptions,
) {
  const hasBoq = !row.is_unplanned && (row.planned_volume > 0 || (row.planned_variants?.length ?? 0) > 0);

  // Status deviasi PO berdasarkan BOQ
  let poStatus: FinancialStatus | undefined;
  if (!hasBoq) {
    if (poValue > 0 && row.total_ordered > 0) poStatus = "over";
  } else {
    if (poValue > plannedValue && row.total_ordered > 0) {
      poStatus = "over";
    } else if (highlightUnder && poValue > 0 && poValue < plannedValue) {
      poStatus = "under";
    }
  }

  // Status deviasi NP berdasarkan PO
  let npStatus: FinancialStatus | undefined;
  if (row.total_ordered > 0 || poValue > 0) {
    if (npValue > poValue && row.total_delivered > 0) {
      npStatus = "over";
    } else if (highlightUnder && npValue > 0 && npValue < poValue) {
      npStatus = "under";
    }
  } else if (npValue > 0 && row.total_delivered > 0) {
    npStatus = "over";
  }

  return (
    <ReportComparisonCell
      npValue={row.total_delivered > 0 || npValue > 0 ? formatNumber(npValue, type) : "-"}
      poValue={row.total_ordered > 0 || poValue > 0 ? formatNumber(poValue, type) : "-"}
      boqValue={hasBoq ? formatNumber(plannedValue, type) : "-"}
      npStatus={npStatus}
      poStatus={poStatus}
    />
  );
}

/**
 * Helper terpusat untuk merender sel komparasi pada baris subtotal footer kelompok.
 * - Kolom Total (Rp) diwarnai status finansial:
 *   - PO vs BOQ / Pagu
 *   - NP vs PO
 * - Kolom non-total (Volume, Subtotal, PPn) selalu netral.
 */
function renderFooterComparison(
  row: EnrichedReportItem,
  npValue: number,
  poValue: number,
  plannedValue: number,
  type: DecimalType = "currency",
  isTotal = false,
) {
  const isPagu = Boolean(row.group_budget && row.group_budget > 0);

  // Untuk kelompok pagu, kolom rincian (volume, subtotal, ppn) tidak memiliki rencana item terpisah
  if (isPagu && !isTotal) {
    return (
      <ReportComparisonCell
        npValue={npValue > 0 ? formatNumber(npValue, type) : "-"}
        poValue={poValue > 0 ? formatNumber(poValue, type) : "-"}
        boqValue="-"
      />
    );
  }

  let poStatus: FinancialStatus | undefined;
  let npStatus: FinancialStatus | undefined;

  if (isTotal) {
    // PO vs BOQ
    if (plannedValue > 0 && poValue > plannedValue) {
      poStatus = "over";
    } else if (plannedValue === 0 && poValue > 0) {
      poStatus = "over";
    } else if (plannedValue > 0 && poValue > 0 && poValue < plannedValue) {
      poStatus = "under";
    }

    // NP vs PO
    if (poValue > 0 && npValue > poValue) {
      npStatus = "over";
    } else if (poValue === 0 && npValue > 0) {
      npStatus = "over";
    } else if (poValue > 0 && npValue > 0 && npValue < poValue) {
      npStatus = "under";
    }
  }

  return (
    <ReportComparisonCell
      npValue={npValue > 0 ? formatNumber(npValue, type) : "-"}
      poValue={poValue > 0 ? formatNumber(poValue, type) : "-"}
      boqValue={plannedValue > 0 ? formatNumber(plannedValue, type) : "-"}
      npStatus={npStatus}
      poStatus={poStatus}
    />
  );
}

/**
 * Helper terpusat untuk merender sel metrik numerik komparasi (volume, subtotal, tax, total).
 */
function renderNumericComparisonCell(
  row: EnrichedReportItem,
  npValue: number,
  poValue: number,
  plannedValue: number,
  type: DecimalType = "currency",
  options?: { isTotal?: boolean; highlightUnderInRow?: boolean },
) {
  if (row.is_group_footer) {
    return renderFooterComparison(row, npValue, poValue, plannedValue, type, options?.isTotal);
  }

  if (row.is_empty_group) {
    return <ReportComparisonCell npValue="-" poValue="-" boqValue="-" />;
  }

  return renderReportComparison(row, {
    npValue,
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
                NP
              </Text>
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

          const npPrice = row.total_delivered > 0 ? row.total_receipt_dpp / row.total_delivered : (row.price ?? 0);
          const poPrice = row.total_ordered > 0 ? row.total_order_dpp / row.total_ordered : (row.price ?? 0);
          const plannedPrice = row.planned_volume > 0 ? row.planned_dpp / row.planned_volume : (row.price ?? 0);

          return renderReportComparison(row, {
            npValue: npPrice,
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
        renderCell: (row) =>
          renderNumericComparisonCell(row, row.total_delivered, row.total_ordered, row.planned_volume, "volume", {
            highlightUnderInRow: false,
          }),
      },
      {
        align: "end",
        header: "Subtotal (Rp)",
        key: "subtotal",
        width: pixel(180),
        renderCell: (row) =>
          renderNumericComparisonCell(row, row.total_receipt_dpp, row.total_order_dpp, row.planned_dpp, "currency"),
      },
      {
        align: "end",
        header: `PPn (${TAX_RATIO_PERCENT}%)`,
        key: "has_tax",
        width: pixel(180),
        renderCell: (row) =>
          renderNumericComparisonCell(row, row.total_receipt_tax, row.total_order_tax, row.planned_tax, "currency"),
      },
      {
        align: "end",
        header: "Total (Rp)",
        key: "total_price",
        width: pixel(180),
        renderCell: (row) =>
          renderNumericComparisonCell(
            row,
            row.total_receipt_price,
            row.total_order_price,
            row.planned_budget,
            "currency",
            {
              isTotal: true,
              highlightUnderInRow: true,
            },
          ),
      },
      {
        align: "end",
        header: "Dipesan (PO)",
        key: "ordered",
        width: pixel(200),
        renderCell: (row) => {
          if (row.is_empty_group || row.is_group_footer) return "-";

          if (isUnplannedItem(row)) {
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
