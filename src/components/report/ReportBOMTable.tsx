import { useMemo, useState } from "react";
import { Badge, HStack, IconButton, Table, Text, VStack } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import {
  type TableColumn,
  pixel,
  proportional,
  useTableGroupedRows,
} from "@astryxdesign/core/Table";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { Eye } from "lucide-react";
import { EntityCode } from "@/components/shared/EntityCode";
import type { BOMReportItem } from "@/db/services";

interface ReportBOMTableProps {
  report: BOMReportItem[];
  loading: boolean;
  onLogClick: (itemId: string, itemPriceId: string, itemName: string) => void;
}

interface EnrichedReportItem extends BOMReportItem, Record<string, unknown> {
  unique_id: string;
}

export function ReportBOMTable({ report, loading, onLogClick }: ReportBOMTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const enrichedReport: EnrichedReportItem[] = useMemo(
    () =>
      report.map((r) => ({
        ...r,
        unique_id: `${r.item_id}-${r.item_price_id}`,
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
    getRowKey: (item) => item.unique_id,
    groupBy: (item) => item.bom_group_name ?? "LAINNYA",
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
  });

  const columns: TableColumn<EnrichedReportItem>[] = [
    {
      header: "No.",
      key: "no",
      width: pixel(60),
      renderCell: (r) => {
        const groupItems = enrichedReport.filter(
          (b) => (b.bom_group_name ?? "LAINNYA") === (r.bom_group_name ?? "LAINNYA"),
        );
        const index = groupItems.findIndex((b) => b.unique_id === r.unique_id);
        return index >= 0 ? index + 1 : "-";
      },
    },
    {
      header: "Item",
      key: "item",
      width: proportional(2),
      renderCell: (r) => {
        const code = formatItemCode(r);
        return (
          <VStack align="start" gap={0.5}>
            <Text weight="medium">{r.item_name}</Text>
            {code ? (
              <EntityCode id={code} />
            ) : (
              <Text size="sm" color="secondary">
                -
              </Text>
            )}
          </VStack>
        );
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
    },
    {
      align: "end",
      header: "Harga Satuan (Rp)",
      key: "price",
      width: pixel(240),
      renderCell: (r) => {
        const poPrice = r.total_ordered > 0 ? r.total_po_price / r.total_ordered : 0;
        const plannedPrice = r.price ?? 0;
        const isOver = poPrice > plannedPrice;
        const isUnder = poPrice > 0 && poPrice < plannedPrice;
        const color = isOver
          ? "var(--color-error, #d32f2f)"
          : isUnder
            ? "var(--color-success, #2e7d32)"
            : undefined;

        return (
          <VStack gap={0.5} align="end">
            <HStack gap={1} justify="end">
              <Text weight="medium">Realisasi:</Text>
              <Text type="code" style={color ? { color } : undefined}>
                {formatNumber(poPrice)}
              </Text>
            </HStack>
            <HStack gap={1} justify="end">
              <Text size="sm" color="secondary">
                Rencana:
              </Text>
              <Text type="code" size="sm" color="secondary">
                {formatNumber(r.price ?? 0)}
              </Text>
            </HStack>
          </VStack>
        );
      },
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(120),
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
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(240),
      renderCell: (r) => {
        const poTotal = r.total_po_price ?? 0;
        const plannedTotal = r.planned_budget ?? 0;
        const isOver = poTotal > plannedTotal;
        const isUnder = poTotal > 0 && poTotal < plannedTotal;
        const color = isOver
          ? "var(--color-error, #d32f2f)"
          : isUnder
            ? "var(--color-success, #2e7d32)"
            : undefined;

        return (
          <VStack gap={0.5} align="end">
            <HStack gap={1} justify="end">
              <Text weight="medium">Realisasi:</Text>
              <Text type="code" style={color ? { color } : undefined}>
                {formatNumber(poTotal)}
              </Text>
            </HStack>
            <HStack gap={1} justify="end">
              <Text size="sm" color="secondary">
                Rencana:
              </Text>
              <Text type="code" size="sm" color="secondary">
                {formatNumber(r.planned_budget ?? 0)}
              </Text>
            </HStack>
          </VStack>
        );
      },
    },
    {
      align: "end",
      header: "Dipesan (PO)",
      key: "ordered",
      width: proportional(1),
      renderCell: (r) => {
        const percent = r.planned_volume > 0 ? (r.total_ordered / r.planned_volume) * 100 : 0;
        const isOver = percent > 100;
        const isComplete = Math.round(percent) === 100 && !isOver;
        const variant = percent > 100 ? "error" : percent >= 100 ? "success" : "accent";

        return (
          <VStack gap={0.5}>
            <HStack justify="between">
              <Text type="code" color="secondary" weight="medium">
                {`${formatNumber(r.total_ordered, 2)} / ${formatNumber(r.planned_volume, 2)}`}
              </Text>
              <Badge
                variant={isOver ? "red" : isComplete ? "green" : undefined}
                label={`${percent.toFixed(0)}%`}
              />
            </HStack>
            <ProgressBar
              value={r.total_ordered}
              max={r.planned_volume ?? 1}
              variant={variant}
              label=""
            />
          </VStack>
        );
      },
    },
    {
      align: "end",
      header: "Diterima (NP)",
      key: "delivered",
      width: proportional(1),
      renderCell: (r) => {
        const percent = r.total_ordered > 0 ? (r.total_delivered / r.total_ordered) * 100 : 0;
        const isOver = percent > 100;
        const isComplete = Math.round(percent) === 100 && !isOver;
        const variant = percent > 100 ? "error" : percent >= 100 ? "success" : "accent";
        return (
          <VStack gap={0.5}>
            <HStack justify="between">
              <Text type="code" color="secondary" weight="medium">
                {`${formatNumber(r.total_delivered, 2)} / ${formatNumber(r.total_ordered, 2)}`}
              </Text>
              <Badge
                variant={isOver ? "red" : isComplete ? "green" : undefined}
                label={`${percent.toFixed(0)}%`}
              />
            </HStack>
            <ProgressBar
              value={r.total_delivered}
              max={r.total_ordered ?? 1}
              variant={variant}
              label=""
            />
          </VStack>
        );
      },
    },
    {
      header: "Aksi",
      key: "actions",
      width: pixel(80),
      renderCell: (r) => (
        <IconButton
          icon={<Eye size={16} />}
          variant="secondary"
          onClick={() => onLogClick(r.item_id, r.item_price_id, r.item_name)}
          label="Lihat Log"
        />
      ),
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
