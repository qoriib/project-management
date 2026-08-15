import { useState, useMemo } from "react";
import { VStack, Text, HStack, IconButton, Table } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { proportional, pixel, useTableGroupedRows, type TableColumn } from "@astryxdesign/core/Table";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { Eye } from "lucide-react";
import type { DashboardBOMReportItem } from "@/db/services";

interface DashboardBOMTableProps {
  report: DashboardBOMReportItem[];
  loading: boolean;
  onLogClick: (itemId: number, itemPriceId: number, itemName: string) => void;
}

type EnrichedReportItem = DashboardBOMReportItem & Record<string, unknown> & {
  unique_id: string;
};

export function DashboardBOMTable({ report, loading, onLogClick }: DashboardBOMTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const enrichedReport: EnrichedReportItem[] = useMemo(() => report.map(r => ({
    ...r,
    unique_id: `${r.item_id}-${r.item_price_id}`
  })), [report]);

  const { data: groupedData, plugin: groupedPlugin, idKey: groupedIdKey } = useTableGroupedRows<EnrichedReportItem>({
    data: enrichedReport,
    groupBy: (item) => item.stage_name || "Lainnya",
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
    getRowKey: (item) => item.unique_id,
  });

  const columns: TableColumn<EnrichedReportItem>[] = [
    {
      key: "item",
      header: "Item",
      width: proportional(1),
      renderCell: (r) => (
        <VStack gap={0.5}>
          <Text weight="medium">{r.item_name}</Text>
          <Text size="sm" color="secondary">BRG-{String(r.item_id).padStart(4, "0")}</Text>
        </VStack>
      )
    },
    {
      key: "price",
      header: "Harga",
      width: pixel(160),
      renderCell: (r) => {
        const poPrice = r.total_ordered > 0 ? r.total_po_price / r.total_ordered : 0;
        return (
          <VStack gap={0.5}>
            <Text weight="medium">Realisasi: {formatRupiah(poPrice)}</Text>
            <Text size="sm" color="secondary">Rencana: {formatRupiah(r.price || 0)}</Text>
          </VStack>
        );
      }
    },
    {
      key: "qty",
      header: "Volume",
      width: pixel(160),
      renderCell: (r) => (
        <VStack gap={0.5}>
          <Text weight="medium">Realisasi: {formatNumber(r.total_ordered, 2)} {r.unit}</Text>
          <Text size="sm" color="secondary">Rencana: {formatNumber(r.planned_volume, 2)} {r.unit}</Text>
        </VStack>
      )
    },
    {
      key: "subtotal",
      header: "Total Harga",
      width: pixel(200),
      renderCell: (r) => (
        <VStack gap={0.5}>
          <Text weight="medium">Realisasi: {formatRupiah(r.total_po_price || 0)}</Text>
          <Text size="sm" color="secondary">Rencana: {formatRupiah(r.planned_budget || 0)}</Text>
        </VStack>
      )
    },
    {
      key: "ordered",
      header: "Dipesan (PO)",
      width: pixel(180),
      renderCell: (r) => {
        const percent = r.planned_volume > 0 ? (r.total_ordered / r.planned_volume) * 100 : 0;
        const isOver = percent > 100;
        const variant = percent > 100 ? "error" : percent >= 100 ? "success" : "accent";
        return (
          <VStack gap={0.5}>
            <HStack justify="between">
              <Text size="sm" color="secondary" weight="medium">
                {`${formatNumber(r.total_ordered, 2)} / ${formatNumber(r.planned_volume, 2)} ${r.unit}`}
              </Text>
              <Text
                size="sm"
                color={isOver ? undefined : "primary"}
                weight="bold"
                style={isOver ? { color: "var(--color-error, #d32f2f)" } : undefined}
              >
                {percent.toFixed(0)}%
              </Text>
            </HStack>
            <ProgressBar value={r.total_ordered} max={r.planned_volume || 1} variant={variant} label="" />
          </VStack>
        );
      }
    },
    {
      key: "delivered",
      header: "Diterima (DLV)",
      width: pixel(180),
      renderCell: (r) => {
        const percent = r.total_ordered > 0 ? (r.total_delivered / r.total_ordered) * 100 : 0;
        const isOver = percent > 100;
        const variant = percent > 100 ? "error" : percent >= 100 ? "success" : "accent";
        return (
          <VStack gap={0.5}>
            <HStack justify="between">
              <Text size="sm" color="secondary" weight="medium">
                {`${formatNumber(r.total_delivered, 2)} / ${formatNumber(r.total_ordered, 2)} ${r.unit}`}
              </Text>
              <Text
                size="sm"
                color={isOver ? undefined : "primary"}
                weight="bold"
                style={isOver ? { color: "var(--color-error, #d32f2f)" } : undefined}
              >
                {percent.toFixed(0)}%
              </Text>
            </HStack>
            <ProgressBar value={r.total_delivered} max={r.total_ordered || 1} variant={variant} label="" />
          </VStack>
        );
      }
    },
    {
      key: "actions",
      header: "",
      width: pixel(80),
      renderCell: (r) => (
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
      hasHover
      columns={columns}
      data={groupedData}
      idKey={groupedIdKey}
      plugins={{ grouping: groupedPlugin }}
    />
  );
}
