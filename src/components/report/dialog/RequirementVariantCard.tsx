import { useMemo } from "react";
import { Card, Heading, Text, VStack } from "@astryxdesign/core";
import { Table, type TableColumn, pixel, useTableRowIndex } from "@astryxdesign/core/Table";
import { formatNumber } from "@/utils/formatters";
import type { RequirementReportItem, RequirementReportVariant } from "@/db/services/report.service";

interface VariantRow extends RequirementReportVariant, Record<string, unknown> {
  unique_id: string;
}

interface RequirementVariantCardProps {
  item: RequirementReportItem;
}

export function RequirementVariantCard({ item }: RequirementVariantCardProps) {
  const plannedRows: VariantRow[] = useMemo(
    () =>
      (item.planned_variants || []).map((v, i) => ({
        ...v,
        unique_id: `plan-${v.item_price_id}-${i}`,
      })),
    [item.planned_variants],
  );

  const plannedIndexPlugin = useTableRowIndex({
    data: plannedRows,
    getRowKey: (row: VariantRow) => row.unique_id,
    label: "#",
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
    <Card padding={3}>
      <VStack gap={2}>
        <Heading level={4}>Kebutuhan (BOM)</Heading>
        {plannedRows.length > 0 ? (
          <VStack gap={0}>
            <Table
              textOverflow="truncate"
              columns={columns}
              data={plannedRows}
              idKey="unique_id"
              plugins={{
                rowIndex: plannedIndexPlugin,
                footer: {
                  transformBodyRow: (props, _row, index) => {
                    if (index === plannedRows.length - 1) {
                      return {
                        ...props,
                        afterRow: (
                          <tr className="astryx-table-row" style={{ background: "var(--color-surface-sunken)" }}>
                            <td
                              className="astryx-table-cell"
                              colSpan={5}
                              style={{ textAlign: "right", paddingRight: "var(--spacing-4)" }}
                            >
                              <Text weight="bold" color="secondary">
                                TOTAL BUDGET
                              </Text>
                            </td>
                            <td
                              className="astryx-table-cell"
                              style={{ textAlign: "right", paddingRight: "var(--spacing-4)" }}
                            >
                              <Text weight="bold" type="code" size="lg">
                                {formatNumber(item.planned_budget)}
                              </Text>
                            </td>
                          </tr>
                        ),
                      };
                    }
                    return props;
                  },
                },
              }}
            />
          </VStack>
        ) : (
          <VStack align="center" padding={2}>
            <Text size="sm" color="secondary">
              Tidak ada data kebutuhan (BOM) untuk item ini.
            </Text>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}
