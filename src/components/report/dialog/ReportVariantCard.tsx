import { useMemo, useState } from "react";
import { Card, EmptyState, HStack, Heading, Text } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import {
  Table,
  type TableColumn,
  pixel,
  useTablePagination,
  paginateData,
  TableRow,
  TableCell,
  proportional,
} from "@astryxdesign/core/Table";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { formatNumber } from "@/utils/formatters";
import { TAX_RATIO_PERCENT } from "@/utils/calc";
import type { RequirementReportItem, RequirementReportVariant } from "@/db/services";

interface VariantRow extends RequirementReportVariant, Record<string, unknown> {
  unique_id: string;
}

export type ReportVariantType = "planned" | "order" | "receipt";

interface ReportVariantCardProps {
  type: ReportVariantType;
  item: RequirementReportItem;
}

const VARIANT_CONFIG: Record<
  ReportVariantType,
  {
    title: string;
    emptyTitle: string;
    idPrefix: string;
    getVariants: (item: RequirementReportItem) => RequirementReportVariant[] | undefined;
    getTotalAmount: (item: RequirementReportItem) => number;
  }
> = {
  planned: {
    title: "Kebutuhan (BOQ)",
    emptyTitle: "Tidak ada rincian kebutuhan (BOQ)",
    idPrefix: "plan",
    getVariants: (item) => item.planned_variants,
    getTotalAmount: (item) => item.planned_budget,
  },
  order: {
    title: "Pengadaan (PO)",
    emptyTitle: "Belum ada rincian pemesanan (PO)",
    idPrefix: "order",
    getVariants: (item) => item.order_variants,
    getTotalAmount: (item) => item.total_order_price,
  },
  receipt: {
    title: "Penerimaan (NP)",
    emptyTitle: "Belum ada rincian penerimaan (NP)",
    idPrefix: "receipt",
    getVariants: (item) => item.receipt_variants,
    getTotalAmount: (item) => item.total_receipt_price || 0,
  },
};

export function ReportVariantCard({ type, item }: ReportVariantCardProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const config = VARIANT_CONFIG[type];
  const variants = config.getVariants(item) || [];
  const totalAmount = config.getTotalAmount(item);

  const variantRows: VariantRow[] = useMemo(
    () =>
      variants.map((variant, index) => ({
        ...variant,
        unique_id: `${config.idPrefix}-${variant.item_price_id}-${index}`,
      })),
    [variants, config.idPrefix],
  );

  const paginatedRows = useMemo(() => paginateData(variantRows, page, pageSize), [variantRows, page, pageSize]);

  const paginationPlugin = useTablePagination<VariantRow>({
    page,
    onPageChange: setPage,
    totalItems: variantRows.length,
    pageSize,
    variant: "pages",
    size: "sm",
  });

  const rowIndexPlugin = useTableRowIndex({
    data: paginatedRows,
    getRowKey: (row: VariantRow) => row.unique_id,
    startFrom: (page - 1) * pageSize + 1,
  });

  const columns: TableColumn<VariantRow>[] = useMemo(
    () => [
      {
        align: "end",
        header: "Harga (Rp)",
        key: "price",
        width: pixel(160),
        renderCell: (row) => <Text type="code">{formatNumber(row.price, "currency")}</Text>,
      },
      {
        align: "end",
        header: "Volume",
        key: "qty",
        width: pixel(80),
        renderCell: (row) => <Text type="code">{formatNumber(row.qty, "volume")}</Text>,
      },
      {
        align: "end",
        header: "Subtotal (Rp)",
        key: "dpp",
        width: pixel(160),
        renderCell: (row) => <Text type="code">{formatNumber(row.dpp, "currency")}</Text>,
      },
      {
        align: "end",
        header: `PPn (${TAX_RATIO_PERCENT}%)`,
        key: "has_tax",
        width: pixel(160),
        renderCell: (row) => (row.has_tax ? <Text type="code">{formatNumber(row.tax_amount, "currency")}</Text> : "-"),
      },
      {
        align: "end",
        header: "Total (Rp)",
        key: "subtotal",
        width: proportional(1, { minWidth: 180 }),
        renderCell: (row) => (
          <Text type="code" weight="bold">
            {formatNumber(row.subtotal, "currency")}
          </Text>
        ),
      },
    ],
    [],
  );

  return (
    <Card>
      <Layout
        height="auto"
        header={
          <LayoutHeader hasDivider>
            <Heading level={4}>{config.title}</Heading>
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={0}>
            <Table<VariantRow>
              hasHover
              textOverflow="truncate"
              columns={columns}
              data={paginatedRows}
              idKey="unique_id"
              emptyState={<EmptyState isCompact title={config.emptyTitle} />}
              plugins={{
                rowIndex: rowIndexPlugin,
                pagination: paginationPlugin,
                ...(variantRows.length > 0
                  ? {
                      footer: {
                        transformBodyRow: (rowProps, _row, index) => {
                          if (index === paginatedRows.length - 1) {
                            return {
                              ...rowProps,
                              afterRow: (
                                <TableRow>
                                  <TableCell colSpan={5}>
                                    <HStack justify="end">
                                      <Text weight="bold" color="secondary">
                                        Total
                                      </Text>
                                    </HStack>
                                  </TableCell>
                                  <TableCell>
                                    <HStack justify="end">
                                      <Text weight="bold" type="code" size="lg">
                                        {formatNumber(totalAmount, "currency")}
                                      </Text>
                                    </HStack>
                                  </TableCell>
                                </TableRow>
                              ),
                            };
                          }
                          return rowProps;
                        },
                      },
                    }
                  : {}),
              }}
            />
          </LayoutContent>
        }
      />
    </Card>
  );
}
