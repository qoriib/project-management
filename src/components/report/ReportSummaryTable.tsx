import { useMemo, useState } from "react";
import { EmptyState, HStack, Table, Text } from "@astryxdesign/core";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { useTableGroupedRows } from "@astryxdesign/core/Table";
import type { RequirementReportItem } from "@/db/services";
import { type EnrichedReportItem, useReportSummaryColumns } from "./table/useReportSummaryColumns";

interface ReportSummaryTableProps {
  report: RequirementReportItem[];
  loading: boolean;
  onLogClick: (item: RequirementReportItem) => void;
}

export function ReportSummaryTable({ report, loading, onLogClick }: ReportSummaryTableProps) {
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
  });

  const columns = useReportSummaryColumns({ onLogClick });

  if (report.length === 0 && !loading) {
    return <EmptyState isCompact title="Belum ada laporan kebutuhan (BOM)" />;
  }

  return (
    <Table
      hasHover
      textOverflow="truncate"
      columns={columns}
      data={groupedData}
      idKey={groupedIdKey}
      plugins={{ grouping: groupedPlugin, rowIndex: rowIndexPlugin }}
      emptyState={<EmptyState isCompact title="Belum ada laporan kebutuhan (BOM)" />}
    />
  );
}
