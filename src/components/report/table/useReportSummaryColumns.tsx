import { Badge, HStack, IconButton, Text, VStack } from "@astryxdesign/core";
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

export function useReportSummaryColumns({ onLogClick }: UseReportSummaryColumnsProps) {
  const columns: TableColumn<EnrichedReportItem>[] = [
    {
      header: "Item",
      key: "item",
      width: proportional(1, { minWidth: 280 }),
      renderCell: (r) => {
        if (r.is_group_footer) {
          return <Text weight="bold">Subtotal {r.group_name}</Text>;
        }

        if (r.is_empty_group) {
          return <Text color="secondary">(Belum ada rincian item)</Text>;
        }

        const code = formatItemCode(r);
        return (
          <VStack gap={0.5} align="start">
            <HStack gap={2} align="center">
              <Text weight="medium">{r.item_name}</Text>
              {r.is_unplanned ? <Badge variant="warning" label="Luar BOQ" /> : null}
            </HStack>
            {code ? <EntityCode size="sm" id={code} /> : null}
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
        if (r.is_group_footer || r.is_empty_group) {
          return <Text color="secondary">-</Text>;
        }

        const poPrice = r.total_ordered > 0 ? r.total_order_dpp / r.total_ordered : (r.price ?? 0);

        // Untuk kelompok pagu, tiap row item cukup tampilkan data PO saja
        if (r.group_budget && r.group_budget > 0) {
          return <Text type="code">{poPrice > 0 ? formatNumber(poPrice, 2) : "-"}</Text>;
        }

        const plannedPrice = r.planned_volume > 0 ? r.planned_dpp / r.planned_volume : (r.price ?? 0);
        const isOver = !r.is_unplanned && poPrice > plannedPrice && r.total_ordered > 0;
        const isUnder = !r.is_unplanned && poPrice > 0 && poPrice < plannedPrice;

        return (
          <ReportComparisonCell
            poValue={r.total_ordered > 0 ? formatNumber(poPrice, 2) : "-"}
            bomValue={r.is_unplanned ? "-" : formatNumber(plannedPrice, 2)}
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
      renderCell: (r) => {
        if (r.is_group_footer) {
          if (r.group_budget && r.group_budget > 0) {
            return <Text color="secondary">-</Text>;
          }
          return (
            <ReportComparisonCell
              poValue={formatNumber(r.total_ordered, 5)}
              bomValue={formatNumber(r.planned_volume, 5)}
              poStatus={r.total_ordered > r.planned_volume && r.planned_volume > 0 ? "over" : undefined}
            />
          );
        }

        if (r.is_empty_group) {
          return <ReportComparisonCell poValue="-" bomValue="-" />;
        }

        // Untuk kelompok pagu, cukup data PO saja
        if (r.group_budget && r.group_budget > 0) {
          return <Text type="code">{formatNumber(r.total_ordered, 5)}</Text>;
        }

        const poQty = r.total_ordered ?? 0;
        const plannedQty = r.planned_volume ?? 0;
        const isOver = !r.is_unplanned && poQty > plannedQty && r.total_ordered > 0;

        return (
          <ReportComparisonCell
            poValue={formatNumber(poQty, 5)}
            bomValue={r.is_unplanned ? "-" : formatNumber(plannedQty, 5)}
            poStatus={isOver ? "over" : undefined}
          />
        );
      },
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (r) => {
        if (r.is_group_footer) {
          if (r.group_budget && r.group_budget > 0) {
            return <Text color="secondary">-</Text>;
          }
          return (
            <ReportComparisonCell
              poValue={formatNumber(r.total_order_dpp, 2)}
              bomValue={formatNumber(r.planned_dpp, 2)}
              poStatus={r.total_order_dpp > r.planned_dpp && r.planned_dpp > 0 ? "over" : undefined}
            />
          );
        }

        if (r.is_empty_group) {
          return <ReportComparisonCell poValue="-" bomValue="-" />;
        }

        // Untuk kelompok pagu, cukup data PO saja
        if (r.group_budget && r.group_budget > 0) {
          return <Text type="code">{formatNumber(r.total_order_dpp, 2)}</Text>;
        }

        const poSubtotal = r.total_order_dpp ?? 0;
        const plannedSubtotal = r.planned_dpp ?? 0;
        const isOver = !r.is_unplanned && poSubtotal > plannedSubtotal && r.total_ordered > 0;

        return (
          <ReportComparisonCell
            poValue={formatNumber(poSubtotal, 2)}
            bomValue={r.is_unplanned ? "-" : formatNumber(plannedSubtotal, 2)}
            poStatus={isOver ? "over" : undefined}
          />
        );
      },
    },
    {
      align: "end",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(180),
      renderCell: (r) => {
        if (r.is_group_footer) {
          if (r.group_budget && r.group_budget > 0) {
            return <Text color="secondary">-</Text>;
          }
          return (
            <ReportComparisonCell
              poValue={formatNumber(r.total_order_tax, 2)}
              bomValue={formatNumber(r.planned_tax, 2)}
              poStatus={r.total_order_tax > r.planned_tax && r.planned_tax > 0 ? "over" : undefined}
            />
          );
        }

        if (r.is_empty_group) {
          return <ReportComparisonCell poValue="-" bomValue="-" />;
        }

        // Untuk kelompok pagu, cukup data PO saja
        if (r.group_budget && r.group_budget > 0) {
          return <Text type="code">{formatNumber(r.total_order_tax, 2)}</Text>;
        }

        const poTax = r.total_order_tax ?? 0;
        const plannedTax = r.planned_tax ?? 0;
        const isOver = !r.is_unplanned && poTax > plannedTax && r.total_ordered > 0;

        return (
          <ReportComparisonCell
            poValue={formatNumber(poTax, 2)}
            bomValue={r.is_unplanned ? "-" : formatNumber(plannedTax, 2)}
            poStatus={isOver ? "over" : undefined}
          />
        );
      },
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total_price",
      width: pixel(180),
      renderCell: (r) => {
        if (r.is_group_footer) {
          if (r.group_budget && r.group_budget > 0) {
            const isOver = r.total_order_price > r.planned_budget;
            const isUnder = r.total_order_price > 0 && r.total_order_price < r.planned_budget;
            return (
              <ReportComparisonCell
                poValue={formatNumber(r.total_order_price, 2)}
                bomValue={formatNumber(r.planned_budget, 2)}
                poStatus={isOver ? "over" : isUnder ? "under" : undefined}
              />
            );
          }
          return (
            <ReportComparisonCell
              poValue={formatNumber(r.total_order_price, 2)}
              bomValue={formatNumber(r.planned_budget, 2)}
              poStatus={r.total_order_price > r.planned_budget && r.planned_budget > 0 ? "over" : undefined}
            />
          );
        }

        if (r.is_empty_group) {
          return <ReportComparisonCell poValue="-" bomValue="-" />;
        }

        // Untuk kelompok pagu, cukup data PO saja
        if (r.group_budget && r.group_budget > 0) {
          return <Text type="code">{formatNumber(r.total_order_price, 2)}</Text>;
        }

        const poTotal = r.total_order_price ?? 0;
        const plannedTotal = r.planned_budget ?? 0;
        const isOver = !r.is_unplanned && poTotal > plannedTotal && r.total_ordered > 0;

        return (
          <ReportComparisonCell
            poValue={formatNumber(poTotal, 2)}
            bomValue={r.is_unplanned ? "-" : formatNumber(plannedTotal, 2)}
            poStatus={isOver ? "over" : undefined}
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
        if (r.is_empty_group || r.is_group_footer) {
          return (
            <Text size="sm" color="secondary">
              -
            </Text>
          );
        }

        // Untuk kelompok pagu atau unplanned item, tampilkan jumlah ordered langsung tanpa % per item
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
        if (r.is_empty_group || r.is_group_footer) {
          return (
            <Text size="sm" color="secondary">
              -
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
