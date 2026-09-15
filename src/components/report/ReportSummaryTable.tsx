import { useCallback, useMemo, useState } from "react";
import { EmptyState, Table } from "@astryxdesign/core";
import { useTableGroupedRows, useTableStickyColumns } from "@astryxdesign/core/Table";
import { useReportSummaryGroupedData } from "./table/useReportSummaryGroupedData";
import { extractPaguGroupNames, useUnplannedRowPlugin } from "./table/reportSummaryTableUtils";
import { ReportGroupHeader } from "./table/ReportGroupHeader";
import type { RequirementReportItem } from "@/db/services";
import { type EnrichedReportItem, useReportSummaryColumns } from "./table/useReportSummaryColumns";

interface ReportSummaryTableProps {
  report: RequirementReportItem[];
  loading: boolean;
  onLogClick: (item: RequirementReportItem) => void;
}

export function ReportSummaryTable({ report, loading, onLogClick }: ReportSummaryTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { enrichedReport, groupOrder } = useReportSummaryGroupedData(report);
  const paguGroupNames = useMemo(() => extractPaguGroupNames(report), [report]);

  const handleToggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroups((previousCollapsed) => {
      const updatedCollapsed = new Set(previousCollapsed);
      if (updatedCollapsed.has(groupKey)) {
        updatedCollapsed.delete(groupKey);
      } else {
        updatedCollapsed.add(groupKey);
      }
      return updatedCollapsed;
    });
  }, []);

  const {
    data: groupedData,
    plugin: groupedPlugin,
    idKey: groupedIdKey,
  } = useTableGroupedRows<EnrichedReportItem>({
    collapsedGroups,
    data: enrichedReport,
    getRowKey: (item) => item.unique_id,
    groupBy: (item) => item.group_name ?? "",
    groupOrder,
    onToggleGroup: handleToggleGroup,
    renderGroupHeader: (groupKey) => <ReportGroupHeader groupName={groupKey} isPagu={paguGroupNames.has(groupKey)} />,
  });

  const stickyColumns = useTableStickyColumns<EnrichedReportItem>({
    startKeys: ["item"],
  });

  const unplannedRowPlugin = useUnplannedRowPlugin(paguGroupNames);
  const columns = useReportSummaryColumns({ onLogClick });

  const isReportEmpty = report.length === 0 && !loading;
  if (isReportEmpty) {
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
