import { useMemo, useState } from "react";
import { Badge, EmptyState, HStack, Table, Text } from "@astryxdesign/core";
import { type TablePlugin, useTableGroupedRows, useTableStickyColumns } from "@astryxdesign/core/Table";
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

  const paguGroupSet = useMemo(() => {
    const set = new Set<string>();
    for (const r of report) {
      if (r.group_name && r.group_budget && r.group_budget > 0) {
        set.add(r.group_name);
      }
    }
    return set;
  }, [report]);

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
      <HStack paddingInline={2} align="center" gap={2}>
        {paguGroupSet.has(key) ? <Badge variant="warning" label="Pagu" /> : null}
        <Text weight="bold">{key}</Text>
      </HStack>
    ),
  });

  const stickyColumns = useTableStickyColumns<EnrichedReportItem>({
    startKeys: ["item"],
  });

  const unplannedRowPlugin = useMemo<TablePlugin<EnrichedReportItem>>(
    () => ({
      transformBodyRow: (props, item) => {
        const isPagu = Boolean(
          (item?.group_budget && item.group_budget > 0) || (item?.group_name && paguGroupSet.has(item.group_name)),
        );
        if (item && item.is_unplanned && !isPagu) {
          return {
            ...props,
            htmlProps: {
              ...props.htmlProps,
              style: {
                ...props.htmlProps?.style,
                backgroundColor: "var(--color-warning-muted)",
                "--table-row-overlay": "var(--color-warning-muted)",
                borderBottom: "1px solid var(--color-border)",
              },
            },
          };
        }
        return props;
      },
      transformBodyCell: (props, _column, item) => {
        const isPagu = Boolean(
          (item?.group_budget && item.group_budget > 0) || (item?.group_name && paguGroupSet.has(item.group_name)),
        );
        if (item && item.is_unplanned && !isPagu) {
          return {
            ...props,
            htmlProps: {
              ...props.htmlProps,
              style: {
                ...props.htmlProps?.style,
                backgroundColor: "var(--color-warning-muted)",
                "--table-row-overlay": "var(--color-warning-muted)",
                borderBottom: "1px solid var(--color-border)",
              },
            },
          };
        }
        return props;
      },
    }),
    [paguGroupSet],
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
        stickyColumns,
        grouping: groupedPlugin,
        unplannedRows: unplannedRowPlugin,
      }}
      emptyState={<EmptyState isCompact title="Belum ada laporan kebutuhan (BOQ)" />}
    />
  );
}
