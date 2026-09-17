import { IconButton, Text, VStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Eye } from "lucide-react";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { EntityCode } from "@/components/shared/EntityCode";
import { ReportComparisonCell } from "@/components/shared/ReportComparisonCell";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
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
  decimals?: number;
  highlightUnder?: boolean;
}

/**
 * Helper terpusat untuk merender sel komparasi BOQ vs PO pada baris item biasa.
 * Untuk kelompok pagu, hanya menampilkan nilai PO murni.
 * Untuk item unplanned, menampilkan "-" pada nilai BOQ.
 */
function renderReportComparison(
  r: EnrichedReportItem,
  { poValue, plannedValue, decimals = 2, highlightUnder = false }: ComparisonOptions,
) {
  const isPagu = Boolean(r.group_budget && r.group_budget > 0);

  if (isPagu) {
    return <Text type="code">{poValue > 0 ? formatNumber(poValue, decimals) : "-"}</Text>;
  }

  const isOver = !r.is_unplanned && poValue > plannedValue && r.total_ordered > 0;
  const isUnder = Boolean(highlightUnder && !r.is_unplanned && poValue > 0 && poValue < plannedValue);

  return (
    <ReportComparisonCell
      poValue={r.total_ordered > 0 ? formatNumber(poValue, decimals) : "-"}
      bomValue={r.is_unplanned ? "-" : formatNumber(plannedValue, decimals)}
      poStatus={isOver ? "over" : isUnder ? "under" : undefined}
    />
  );
}

/**
 * Helper terpusat untuk merender sel komparasi pada baris subtotal footer kelompok.
 * Untuk kelompok pagu: kolom volume, dpp, tax mengembalikan "-",
 * sedangkan total_price mendukung perbandingan over/under vs nilai pagu.
 */
function renderFooterComparison(
  r: EnrichedReportItem,
  poVal: number,
  planVal: number,
  decimals = 2,
  supportUnder = false,
) {
  const isPagu = Boolean(r.group_budget && r.group_budget > 0);
  if (isPagu && !supportUnder) {
    return "-";
  }

  const isOver = poVal > planVal && planVal > 0;
  const isUnder = Boolean(supportUnder && isPagu && poVal > 0 && poVal < planVal);

  return (
    <ReportComparisonCell
      poValue={poVal > 0 ? formatNumber(poVal, decimals) : "-"}
      bomValue={planVal > 0 ? formatNumber(planVal, decimals) : "-"}
      poStatus={isOver ? "over" : isUnder ? "under" : undefined}
    />
  );
}

export function useReportSummaryColumns({ onLogClick }: UseReportSummaryColumnsProps) {
  const columns: TableColumn<EnrichedReportItem>[] = [
    {
      header: "Item",
      key: "item",
      width: proportional(1, { minWidth: 280 }),
      renderCell: (r) => {
        if (r.is_group_footer)
          return (
            <Text weight="bold" maxLines={1}>
              Subtotal {r.group_name}
            </Text>
          );
        if (r.is_empty_group) return <Text color="secondary">(Belum ada rincian item)</Text>;

        const code = formatItemCode(r);
        return (
          <VStack gap={0.5} align="start">
            <Text weight="medium" maxLines={1}>
              {r.item_name}
            </Text>
            <EntityCode size="sm" id={code} />
          </VStack>
        );
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (r) => (r.is_group_footer || r.is_empty_group ? "-" : r.unit || "-"),
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(180),
      renderCell: (r) => {
        if (r.is_group_footer || r.is_empty_group) return "-";
        const poPrice = r.total_ordered > 0 ? r.total_order_dpp / r.total_ordered : (r.price ?? 0);
        const plannedPrice = r.planned_volume > 0 ? r.planned_dpp / r.planned_volume : (r.price ?? 0);
        return renderReportComparison(r, { poValue: poPrice, plannedValue: plannedPrice, highlightUnder: true });
      },
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(140),
      renderCell: (r) => {
        if (r.is_group_footer) return renderFooterComparison(r, r.total_ordered, r.planned_volume, 5);
        if (r.is_empty_group) return <ReportComparisonCell poValue="-" bomValue="-" />;
        return renderReportComparison(r, { poValue: r.total_ordered, plannedValue: r.planned_volume, decimals: 5 });
      },
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (r) => {
        if (r.is_group_footer) return renderFooterComparison(r, r.total_order_dpp, r.planned_dpp);
        if (r.is_empty_group) return <ReportComparisonCell poValue="-" bomValue="-" />;
        return renderReportComparison(r, { poValue: r.total_order_dpp, plannedValue: r.planned_dpp });
      },
    },
    {
      align: "end",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(180),
      renderCell: (r) => {
        if (r.is_group_footer) return renderFooterComparison(r, r.total_order_tax, r.planned_tax);
        if (r.is_empty_group) return <ReportComparisonCell poValue="-" bomValue="-" />;
        return renderReportComparison(r, { poValue: r.total_order_tax, plannedValue: r.planned_tax });
      },
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total_price",
      width: pixel(180),
      renderCell: (r) => {
        if (r.is_group_footer) {
          return renderFooterComparison(r, r.total_order_price, r.planned_budget, 2, true);
        }
        if (r.is_empty_group) return <ReportComparisonCell poValue="-" bomValue="-" />;
        return renderReportComparison(r, { poValue: r.total_order_price, plannedValue: r.planned_budget });
      },
    },
    {
      align: "end",
      header: "Dipesan (PO)",
      key: "ordered",
      width: pixel(200),
      renderCell: (r) => {
        if (r.is_empty_group || r.is_group_footer) return "-";

        if ((r.group_budget && r.group_budget > 0) || r.is_unplanned) {
          return (
            <Text type="code" color="secondary" weight="medium">
              {formatNumber(r.total_ordered, 5)}
            </Text>
          );
        }

        const ordered = r.total_ordered ?? 0;
        const planned = r.planned_volume ?? 0;
        const percent = planned > 0 ? (ordered / planned) * 100 : 0;
        const variant = percent > 100 ? "error" : "success";

        return (
          <ProgressBar
            value={ordered}
            max={planned || 1}
            label={`${percent.toFixed(0)}%`}
            hasValueLabel
            formatValueLabel={() => `${formatNumber(ordered, 5)} / ${formatNumber(planned, 5)}`}
            variant={variant}
          />
        );
      },
    },
    {
      align: "end",
      header: "Diterima (NP)",
      key: "delivered",
      width: pixel(200),
      renderCell: (r) => {
        if (r.is_empty_group || r.is_group_footer) return "-";

        const delivered = r.total_delivered ?? 0;
        const ordered = r.total_ordered ?? 0;
        const percent = ordered > 0 ? (delivered / ordered) * 100 : 0;
        const variant = percent > 100 ? "error" : "success";

        return (
          <ProgressBar
            value={delivered}
            max={ordered || 1}
            label={`${percent.toFixed(0)}%`}
            hasValueLabel
            formatValueLabel={() => `${formatNumber(delivered, 5)} / ${formatNumber(ordered, 5)}`}
            variant={variant}
          />
        );
      },
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(80),
      renderCell: (r) => {
        if (r.is_empty_group || r.is_group_footer) return null;

        return (
          <IconButton icon={<Eye />} variant="secondary" onClick={() => onLogClick(r)} label="Lihat Rincian & Log" />
        );
      },
    },
  ];

  return columns;
}
