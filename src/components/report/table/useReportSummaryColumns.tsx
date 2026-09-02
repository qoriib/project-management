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
}

interface UseReportSummaryColumnsProps {
  onLogClick: (item: RequirementReportItem) => void;
}

export function useReportSummaryColumns({ onLogClick }: UseReportSummaryColumnsProps) {
  const columns: TableColumn<EnrichedReportItem>[] = [
    {
      header: "Item",
      key: "item",
      width: proportional(1, { minWidth: 280 }),
      renderCell: (r) => {
        const code = formatItemCode(r);
        return (
          <VStack gap={0.5} align="start">
            <Text weight="medium">{r.item_name}</Text>
            {code ? <EntityCode id={code} /> : null}
          </VStack>
        );
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (r) => r.unit || "-",
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(180),
      renderCell: (r) => {
        const poPrice = r.total_ordered > 0 ? r.total_order_dpp / r.total_ordered : 0;
        const plannedPrice = r.planned_volume > 0 ? r.planned_dpp / r.planned_volume : (r.price ?? 0);
        const isOver = !r.is_unplanned && poPrice > plannedPrice && r.total_ordered > 0;
        const isUnder = !r.is_unplanned && poPrice > 0 && poPrice < plannedPrice;

        return (
          <ReportComparisonCell
            poValue={r.total_ordered > 0 ? formatNumber(poPrice) : "-"}
            bomValue={r.is_unplanned ? "-" : formatNumber(plannedPrice)}
            poStatus={isOver ? "over" : isUnder ? "under" : undefined}
          />
        );
      },
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(140),
      renderCell: (r) => (
        <ReportComparisonCell
          poValue={formatNumber(r.total_ordered)}
          bomValue={r.is_unplanned ? "-" : formatNumber(r.planned_volume)}
        />
      ),
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (r) => (
        <ReportComparisonCell
          poValue={formatNumber(r.total_order_dpp)}
          bomValue={r.is_unplanned ? "-" : formatNumber(r.planned_dpp)}
        />
      ),
    },
    {
      align: "end",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(180),
      renderCell: (r) => (
        <ReportComparisonCell
          poValue={formatNumber(r.total_order_tax)}
          bomValue={r.is_unplanned ? "-" : formatNumber(r.planned_tax)}
        />
      ),
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total_price",
      width: pixel(180),
      renderCell: (r) => {
        const poTotal = r.total_order_price ?? 0;
        const plannedTotal = r.planned_budget ?? 0;
        const isOver = !r.is_unplanned && poTotal > plannedTotal && r.total_ordered > 0;
        const isUnder = !r.is_unplanned && poTotal > 0 && poTotal < plannedTotal;

        return (
          <ReportComparisonCell
            poValue={formatNumber(poTotal)}
            bomValue={r.is_unplanned ? "-" : formatNumber(plannedTotal)}
            poStatus={isOver ? "over" : isUnder ? "under" : undefined}
          />
        );
      },
    },
    {
      align: "end",
      header: "Dipesan (PO)",
      key: "ordered",
      width: pixel(200),
      renderCell: (r) => {
        if (r.is_unplanned) {
          return (
            <Text type="code" color="secondary" weight="medium">
              {formatNumber(r.total_ordered)}
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
            formatValueLabel={() => `${formatNumber(ordered)} / ${formatNumber(planned)}`}
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
        if (r.is_unplanned) {
          return (
            <Text type="code" color="secondary" weight="medium">
              {formatNumber(r.total_delivered)}
            </Text>
          );
        }

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
            formatValueLabel={() => `${formatNumber(delivered)} / ${formatNumber(ordered)}`}
            variant={variant}
          />
        );
      },
    },
    {
      header: "Aksi",
      key: "actions",
      width: pixel(80),
      renderCell: (r) => (
        <IconButton icon={<Eye />} variant="secondary" onClick={() => onLogClick(r)} label="Lihat Rincian & Log" />
      ),
    },
  ];

  return columns;
}
