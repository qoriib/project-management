import { useMemo, useState } from "react";
import { HStack, IconButton, Table, Text, VStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import {
  type TableColumn,
  pixel,
  proportional,
  useTableGroupedRows,
} from "@astryxdesign/core/Table";
import { MultiSelector } from "@astryxdesign/core/MultiSelector";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { formatNumber } from "@/utils/formatters";
import { Eye } from "lucide-react";
import type { BOMReportItem } from "@/db/services";
import { EntityCode } from "@/components/shared/EntityCode";

interface DashboardBOMTableProps {
  report: BOMReportItem[];
  loading: boolean;
  onLogClick: (itemId: string, itemPriceId: string, itemName: string) => void;
}

interface EnrichedReportItem extends BOMReportItem, Record<string, unknown> {
  unique_id: string;
}

export function DashboardBOMTable({ report, loading, onLogClick }: DashboardBOMTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set()),
    enrichedReport: EnrichedReportItem[] = useMemo(
      () =>
        report.map((r) => ({
          ...r,
          unique_id: `${r.item_id}-${r.item_price_id}`,
        })),
      [report],
    ),
    {
      data: groupedData,
      plugin: groupedPlugin,
      idKey: groupedIdKey,
    } = useTableGroupedRows<EnrichedReportItem>({
      collapsedGroups,
      data: enrichedReport,
      getRowKey: (item) => item.unique_id,
      groupBy: (item) => item.bom_group_name || "LAINNYA",
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
    }),
    columns: TableColumn<EnrichedReportItem>[] = [
      {
        header: "Item",
        key: "item",
        renderCell: (r) => (
          <VStack align="start" gap={0.5}>
            <Text weight="medium">{r.item_name}</Text>
            <EntityCode prefix="BRG" id={r.item_id} />
          </VStack>
        ),
        width: proportional(1),
      },
      {
        align: "end",
        header: "Harga Satuan (Rp)",
        key: "price",
        renderCell: (r) => {
          const poPrice = r.total_ordered > 0 ? r.total_po_price / r.total_ordered : 0;
          return (
            <VStack gap={0.5} align="end">
              <HStack gap={1} justify="end">
                <Text weight="medium">Realisasi:</Text>
                <Text type="code">{formatNumber(poPrice)}</Text>
              </HStack>
              <HStack gap={1} justify="end">
                <Text size="sm" color="secondary">
                  Rencana:
                </Text>
                <Text type="code" size="sm" color="secondary">
                  {formatNumber(r.price || 0)}
                </Text>
              </HStack>
            </VStack>
          );
        },
        width: pixel(180),
      },
      {
        header: "Satuan",
        key: "unit",
        renderCell: (r) => r.unit || "-",
        width: pixel(100),
      },
      {
        align: "end",
        header: "Volume",
        key: "qty",
        renderCell: (r) => (
          <VStack gap={0.5} align="end">
            <HStack gap={1} justify="end">
              <Text weight="medium">Realisasi:</Text>
              <Text type="code">{formatNumber(r.total_ordered, 2)}</Text>
            </HStack>
            <HStack gap={1} justify="end">
              <Text size="sm" color="secondary">
                Rencana:
              </Text>
              <Text type="code" size="sm" color="secondary">
                {formatNumber(r.planned_volume, 2)}
              </Text>
            </HStack>
          </VStack>
        ),
        width: pixel(140),
      },
      {
        align: "end",
        header: "Total Harga (Rp)",
        key: "subtotal",
        renderCell: (r) => (
          <VStack gap={0.5} align="end">
            <HStack gap={1} justify="end">
              <Text weight="medium">Realisasi:</Text>
              <Text type="code">{formatNumber(r.total_po_price || 0)}</Text>
            </HStack>
            <HStack gap={1} justify="end">
              <Text size="sm" color="secondary">
                Rencana:
              </Text>
              <Text type="code" size="sm" color="secondary">
                {formatNumber(r.planned_budget || 0)}
              </Text>
            </HStack>
          </VStack>
        ),
        width: pixel(200),
      },
      {
        align: "end",
        header: "Dipesan (PO)",
        key: "ordered",
        renderCell: (r) => {
          const percent = r.planned_volume > 0 ? (r.total_ordered / r.planned_volume) * 100 : 0;
          const isOver = percent > 100;
          const variant = percent > 100 ? "error" : percent >= 100 ? "success" : "accent";
          return (
            <VStack gap={0.5}>
              <HStack justify="between">
                <Text type="code" size="sm" color="secondary" weight="medium">
                  {`${formatNumber(r.total_ordered, 2)} / ${formatNumber(r.planned_volume, 2)}`}
                </Text>
                <Text
                  type="code"
                  size="sm"
                  color={isOver ? undefined : "primary"}
                  weight="bold"
                  style={isOver ? { color: "var(--color-error, #d32f2f)" } : undefined}
                >
                  {percent.toFixed(0)}%
                </Text>
              </HStack>
              <ProgressBar
                value={r.total_ordered}
                max={r.planned_volume || 1}
                variant={variant}
                label=""
              />
            </VStack>
          );
        },
        width: pixel(180),
      },
      {
        align: "end",
        header: "Diterima (NP)",
        key: "delivered",
        renderCell: (r) => {
          const percent = r.total_ordered > 0 ? (r.total_delivered / r.total_ordered) * 100 : 0;
          const isOver = percent > 100;
          const variant = percent > 100 ? "error" : percent >= 100 ? "success" : "accent";
          return (
            <VStack gap={0.5}>
              <HStack justify="between">
                <Text type="code" size="sm" color="secondary" weight="medium">
                  {`${formatNumber(r.total_delivered, 2)} / ${formatNumber(r.total_ordered, 2)}`}
                </Text>
                <Text
                  type="code"
                  size="sm"
                  color={isOver ? undefined : "primary"}
                  weight="bold"
                  style={isOver ? { color: "var(--color-error, #d32f2f)" } : undefined}
                >
                  {percent.toFixed(0)}%
                </Text>
              </HStack>
              <ProgressBar
                value={r.total_delivered}
                max={r.total_ordered || 1}
                variant={variant}
                label=""
              />
            </VStack>
          );
        },
        width: pixel(180),
      },
      {
        header: "",
        key: "actions",
        renderCell: (r) => (
          <IconButton
            icon={<Eye size={16} />}
            variant="secondary"
            onClick={() => onLogClick(r.item_id, r.item_price_id, r.item_name)}
            label="Lihat Log"
          />
        ),
        width: pixel(80),
      },
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
      textOverflow="truncate"
      columns={columns}
      data={groupedData}
      idKey={groupedIdKey}
      plugins={{ grouping: groupedPlugin }}
    />
  );
}
