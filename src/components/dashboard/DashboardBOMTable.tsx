import { useState, useMemo } from "react";
import { VStack, Text, HStack, IconButton, Table } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { proportional, pixel, useTableGroupedRows } from "@astryxdesign/core/Table";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { Eye } from "lucide-react";
import type { DashboardBOMReportItem } from "@/db/services";

interface DashboardBOMTableProps {
  report: DashboardBOMReportItem[];
  loading: boolean;
  onLogClick: (itemId: number, itemPriceId: number, itemName: string) => void;
}

export function DashboardBOMTable({ report, loading, onLogClick }: DashboardBOMTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const enrichedReport = useMemo(() => report.map(r => ({
    ...r,
    unique_id: `${r.item_id}-${r.item_price_id}`
  })), [report]);

  const { data: groupedData, plugin: groupedPlugin, idKey: groupedIdKey } = useTableGroupedRows({
    data: enrichedReport as any,
    groupBy: (item: any) => item.stage_name || "Lainnya",
    collapsedGroups,
    onToggleGroup: (key) => {
      setCollapsedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    renderGroupHeader: (key) => (
      <HStack justify="between" align="center" paddingInline={1} width="100%">
        <Text weight="bold">{key}</Text>
      </HStack>
    ),
    getRowKey: (item: any) => item.unique_id,
  });

  const columns = [
    {
      key: "item",
      header: "Item",
      width: proportional(1),
      renderCell: (r: any) => <Text weight="medium">{r.item_name}</Text>
    },
    {
      key: "planned",
      header: "Rencana (BOM)",
      width: pixel(180),
      renderCell: (r: any) => (
        <VStack gap={1}>
          <Text size="sm">{formatNumber(r.planned_volume, 2)} {r.unit}</Text>
          <Text size="2xs" color="secondary">{formatRupiah(r.planned_budget)}</Text>
        </VStack>
      )
    },
    {
      key: "ordered",
      header: "Dipesan (PO)",
      width: pixel(180),
      renderCell: (r: any) => {
        const percent = r.planned_volume > 0 ? (r.total_ordered / r.planned_volume) * 100 : 0;
        const isOver = percent > 100;
        return (
          <ProgressBar
            label={`${formatNumber(r.total_ordered, 2)} ${r.unit}`}
            value={r.total_ordered}
            max={r.planned_volume || 1}
            variant={isOver ? 'warning' : percent === 100 ? 'success' : 'accent'}
            hasValueLabel
          />
        );
      }
    },
    {
      key: "delivered",
      header: "Diterima (DLV)",
      width: pixel(180), renderCell: (r: any) => {
        const percent = r.total_ordered > 0 ? (r.total_delivered / r.total_ordered) * 100 : 0;
        return (
          <ProgressBar
            label={`${formatNumber(r.total_delivered, 2)} ${r.unit}`}
            value={r.total_delivered}
            max={r.total_ordered || 1}
            variant={percent === 100 ? 'success' : 'accent'}
            hasValueLabel
          />
        );
      }
    },
    {
      key: "actions",
      header: "",
      width: pixel(80),
      renderCell: (r: any) => (
        <IconButton
          icon={<Eye size={16} />}
          variant="secondary"
          onClick={() => onLogClick(r.item_id, r.item_price_id, r.item_name)}
          label="Lihat Log"
        />
      )
    }
  ];

  if (report.length === 0 && !loading) {
    return (
      <VStack align="center" padding={8}>
        <Text color="secondary">Belum ada Kebutuhan (BOM) untuk proyek ini.</Text>
      </VStack>
    );
  }

  return (
    <Table
      verticalAlign="top"
      hasHover
      columns={columns as any}
      data={groupedData as any}
      idKey={groupedIdKey}
      plugins={{ grouping: groupedPlugin }}
    />
  );
}
