import { useMemo, useState } from "react";
import { EmptyState, HStack, Table, Text } from "@astryxdesign/core";
import { type TablePlugin, useTableGroupedRows, useTableStickyColumns } from "@astryxdesign/core/Table";
import { useTableGroupRowPlugin } from "@/components/shared/useTableGroupRowPlugin";
import type { RequirementReportItem } from "@/db/services";
import { type EnrichedReportItem, useReportSummaryColumns } from "./table/useReportSummaryColumns";
import { useReportSummaryGroupedData } from "./table/useReportSummaryGroupedData";

interface ReportSummaryTableProps {
  report: RequirementReportItem[];
  loading: boolean;
  onLogClick: (item: RequirementReportItem) => void;
}

export function ReportSummaryTable({ report, loading, onLogClick }: ReportSummaryTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { enrichedReport, groupOrder } = useReportSummaryGroupedData(report);

  const {
    data: groupedData,
    plugin: groupedPlugin,
    idKey: groupedIdKey,
  } = useTableGroupedRows<EnrichedReportItem>({
    collapsedGroups,
    data: enrichedReport,
    getRowKey: (item: EnrichedReportItem) => item.unique_id,
    groupBy: (item: EnrichedReportItem) => item.group_name ?? "",
    groupOrder,
    onToggleGroup: (key: string) => {
      setCollapsedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    renderGroupHeader: (key: string) => (
      <HStack paddingInline={2} align="center">
        <Text weight="bold">{key}</Text>
      </HStack>
    ),
  });

  const stickyColumns = useTableStickyColumns<EnrichedReportItem>({
    startKeys: ["item"],
  });

  const groupRowPlugin = useTableGroupRowPlugin<EnrichedReportItem>();

  const unplannedRowPlugin = useMemo<TablePlugin<EnrichedReportItem>>(
    () => ({
      transformBodyRow: (props, item) => {
        if (item && Boolean(item.is_unplanned)) {
          return {
            ...props,
            htmlProps: {
              ...props.htmlProps,
              style: {
                ...props.htmlProps?.style,
                backgroundColor: "var(--color-background-yellow)",
                "--table-sticky-background": "var(--color-background-yellow)",
              },
            },
          };
        }
        return props;
      },
      transformBodyCell: (props, _column, item) => {
        if (item && Boolean(item.is_unplanned)) {
          return {
            ...props,
            htmlProps: {
              ...props.htmlProps,
              style: {
                ...props.htmlProps?.style,
                backgroundColor: "var(--color-background-yellow)",
              },
            },
          };
        }
        return props;
      },
    }),
    [],
  );

  const columns = useReportSummaryColumns({ onLogClick });

  if (report.length === 0 && !loading) {
    return <EmptyState isCompact title="Belum ada laporan kebutuhan (BOQ)" />;
  }

  return (
    <Table
      hasHover
      textOverflow="truncate"
      columns={columns}
      data={groupedData}
      idKey={groupedIdKey}
      plugins={{
        grouping: groupedPlugin,
        stickyColumns,
        groupRow: groupRowPlugin,
        unplannedRow: unplannedRowPlugin,
      }}
      emptyState={<EmptyState isCompact title="Belum ada laporan kebutuhan (BOQ)" />}
    />
  );
}
