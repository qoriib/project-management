import { useMemo, useState } from "react";
import { Card, HStack, Heading, Text, VStack } from "@astryxdesign/core";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import {
  Table,
  type TableColumn,
  pixel,
  useTableRowIndex,
  useTablePagination,
  paginateData,
  TableRow,
  TableCell,
} from "@astryxdesign/core/Table";
import { formatNumber } from "@/utils/formatters";
import type { RequirementReportItem, RequirementReportVariant } from "@/db/services/report.service";

interface VariantRow extends RequirementReportVariant, Record<string, unknown> {
  unique_id: string;
}

interface RequirementVariantCardProps {
  item: RequirementReportItem;
}

export function RequirementVariantCard({ item }: RequirementVariantCardProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const plannedRows: VariantRow[] = useMemo(
    () =>
      (item.planned_variants || []).map((v, i) => ({
        ...v,
        unique_id: `plan-${v.item_price_id}-${i}`,
      })),
    [item.planned_variants],
  );

  const paginatedRows = useMemo(() => paginateData(plannedRows, page, pageSize), [plannedRows, page, pageSize]);

  const paginationPlugin = useTablePagination<VariantRow>({
    page,
    onPageChange: setPage,
    totalItems: plannedRows.length,
    pageSize,
    variant: "pages",
    size: "sm",
  });

  const plannedIndexPlugin = useTableRowIndex({
    data: paginatedRows as VariantRow[],
    getRowKey: (row: VariantRow) => row.unique_id,
    label: "#",
    startFrom: (page - 1) * pageSize + 1,
  });

  const columns: TableColumn<VariantRow>[] = [
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(140),
      renderCell: (r) => <Text type="code">{formatNumber(r.price)}</Text>,
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(100),
      renderCell: (r) => <Text type="code">{formatNumber(r.qty)}</Text>,
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "dpp",
      width: pixel(140),
      renderCell: (r) => <Text type="code">{formatNumber(r.dpp)}</Text>,
    },
    {
      align: "end",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(120),
      renderCell: (r) => <Text type="code">{r.has_tax === 1 ? formatNumber(r.tax_amount) : "-"}</Text>,
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "subtotal",
      width: pixel(150),
      renderCell: (r) => (
        <Text type="code" weight="bold">
          {formatNumber(r.subtotal)}
        </Text>
      ),
    },
  ];

  return (
    <Card>
      <VStack gap={3}>
        <Heading level={4}>Kebutuhan (BOM)</Heading>
        {plannedRows.length > 0 ? (
          <Table
            hasHover
            density="compact"
            textOverflow="truncate"
            columns={columns}
            data={paginatedRows as VariantRow[]}
            idKey="unique_id"
            plugins={{
              rowIndex: plannedIndexPlugin,
              pagination: paginationPlugin,
              footer: {
                transformBodyRow: (props, _row, index) => {
                  if (index === paginatedRows.length - 1) {
                    return {
                      ...props,
                      afterRow: (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <HStack justify="end">
                              <Text weight="bold" color="secondary">
                                TOTAL BUDGET
                              </Text>
                            </HStack>
                          </TableCell>
                          <TableCell>
                            <HStack justify="end">
                              <Text weight="bold" type="code" size="lg">
                                {formatNumber(item.planned_budget)}
                              </Text>
                            </HStack>
                          </TableCell>
                        </TableRow>
                      ),
                    };
                  }
                  return props;
                },
              },
            }}
          />
        ) : (
          <EmptyState
            title="Tidak ada data kebutuhan (BOM)"
            description="Tidak ada rincian kebutuhan Item untuk item ini."
            isCompact
          />
        )}
      </VStack>
    </Card>
  );
}
