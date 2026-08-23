import { useMemo, useState } from "react";
import { HStack, IconButton, Table, Text } from "@astryxdesign/core";
import { Item } from "@astryxdesign/core/Item";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { Eye } from "lucide-react";
import { EntityCode } from "@/components/shared/EntityCode";
import { ReportComparisonCell } from "@/components/shared/ReportComparisonCell";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { type TableColumn, pixel, proportional, useTableGroupedRows } from "@astryxdesign/core/Table";
import type { RequirementReportItem } from "@/db/services";

interface ReportRequirementTableProps {
  report: RequirementReportItem[];
  loading: boolean;
  onLogClick: (item: RequirementReportItem) => void;
}

interface EnrichedReportItem extends RequirementReportItem, Record<string, unknown> {
  unique_id: string;
}

export function ReportRequirementTable({ report, loading, onLogClick }: ReportRequirementTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const enrichedReport: EnrichedReportItem[] = useMemo(
    () =>
      report.map((r) => ({
        ...r,
        unique_id: r.item_id,
      })),
    [report],
  );

  const {
    data: groupedData,
    plugin: groupedPlugin,
    idKey: groupedIdKey,
  } = useTableGroupedRows<EnrichedReportItem>({
    collapsedGroups,
    data: enrichedReport,
    getRowKey: (item: EnrichedReportItem) => item.unique_id,
    groupBy: (item: EnrichedReportItem) => (item.category as string) ?? "LAINNYA",
    onToggleGroup: (key: string) => {
      setCollapsedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    renderGroupHeader: (key: string) => (
      <HStack justify="between" align="center" paddingInline={1} width="100%">
        <Text weight="bold">{key}</Text>
      </HStack>
    ),
  });

  const rowIndexPlugin = useTableRowIndex({
    data: enrichedReport,
    getRowKey: (item: EnrichedReportItem) => item.unique_id,
    label: "#",
  });

  const columns: TableColumn<EnrichedReportItem>[] = [
    {
      header: "Item Material",
      key: "item",
      width: proportional(2),
      renderCell: (r) => {
        const code = formatItemCode(r);
        return <Item density="compact" label={r.item_name} description={code ? <EntityCode id={code} /> : undefined} />;
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(75),
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
            poColor={isUnder ? "accent" : undefined}
            isError={isOver}
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
      width: pixel(150),
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
      width: proportional(2),
      renderCell: (r) => {
        const poTotal = r.total_order_price ?? 0;
        const plannedTotal = r.planned_budget ?? 0;
        const isOver = !r.is_unplanned && poTotal > plannedTotal && r.total_ordered > 0;
        const isUnder = !r.is_unplanned && poTotal > 0 && poTotal < plannedTotal;

        return (
          <ReportComparisonCell
            poValue={formatNumber(poTotal)}
            bomValue={r.is_unplanned ? "-" : formatNumber(plannedTotal)}
            poColor={isUnder ? "accent" : undefined}
            isError={isOver}
          />
        );
      },
    },
    {
      align: "end",
      header: "Dipesan (PO)",
      key: "ordered",
      width: proportional(2),
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
        const variant = percent > 100 ? "error" : percent >= 100 ? "success" : "accent";

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
      width: proportional(2),
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
        const variant = percent > 100 ? "error" : percent >= 100 ? "success" : "accent";

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
      width: pixel(70),
      renderCell: (r) => (
        <IconButton
          icon={<Eye size={16} />}
          variant="secondary"
          onClick={() => onLogClick(r)}
          label="Lihat Rincian & Log"
        />
      ),
    },
  ];

  if (report.length === 0 && !loading) {
    return (
      <EmptyState
        title="Belum ada Kebutuhan (BOM)"
        description="Belum ada data kebutuhan Item yang direncanakan untuk proyek ini."
        isCompact
      />
    );
  }

  return (
    <Table
      hasHover
      textOverflow="truncate"
      columns={columns}
      data={groupedData}
      idKey={groupedIdKey}
      plugins={{ grouping: groupedPlugin, rowIndex: rowIndexPlugin }}
    />
  );
}
