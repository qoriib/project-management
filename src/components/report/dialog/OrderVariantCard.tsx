import { useMemo, useState } from "react";
import { Card, HStack, Heading, Text, VStack } from "@astryxdesign/core";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import {
  Table,
  type TableColumn,
  pixel,
  proportional,
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

interface OrderVariantCardProps {
  item: RequirementReportItem;
}

export function OrderVariantCard({ item }: OrderVariantCardProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const orderRows: VariantRow[] = useMemo(
    () =>
      (item.order_variants || []).map((v, i) => ({
        ...v,
        unique_id: `order-${v.item_price_id}-${i}`,
      })),
    [item.order_variants],
  );

  const paginatedRows = useMemo(() => paginateData(orderRows, page, pageSize), [orderRows, page, pageSize]);

  const paginationPlugin = useTablePagination<VariantRow>({
    page,
    onPageChange: setPage,
    totalItems: orderRows.length,
    pageSize,
    variant: "pages",
    size: "sm",
  });

  const orderIndexPlugin = useTableRowIndex({
    data: paginatedRows as VariantRow[],
    getRowKey: (row: VariantRow) => row.unique_id,
    label: "#",
    startFrom: (page - 1) * pageSize + 1,
  });

  const columns: TableColumn<VariantRow>[] = [
    {
      header: "Vendor",
      key: "vendor",
      width: proportional(2),
      renderCell: (r) => <Text weight="medium">{r.vendor_name || "-"}</Text>,
    },
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
      width: pixel(90),
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
        <Heading level={4}>Pemesanan (PO)</Heading>
        {orderRows.length > 0 ? (
          <Table
            hasHover
            density="compact"
            textOverflow="truncate"
            columns={columns}
            data={paginatedRows as VariantRow[]}
            idKey="unique_id"
            plugins={{
              rowIndex: orderIndexPlugin,
              pagination: paginationPlugin,
              footer: {
                transformBodyRow: (props, _row, index) => {
                  if (index === paginatedRows.length - 1) {
                    return {
                      ...props,
                      afterRow: (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <HStack justify="end">
                              <Text weight="bold" color="secondary">
                                TOTAL PEMESANAN
                              </Text>
                            </HStack>
                          </TableCell>
                          <TableCell>
                            <HStack justify="end">
                              <Text weight="bold" type="code" size="lg">
                                {formatNumber(item.total_order_price)}
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
            title="Belum ada pemesanan (PO)"
            description="Belum ada rincian pemesanan untuk item ini."
            isCompact
          />
        )}
      </VStack>
    </Card>
  );
}
