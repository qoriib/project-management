import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, Heading, Link, Text, Timestamp } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { useNavigate } from "@tanstack/react-router";
import {
  Table,
  type TableColumn,
  pixel,
  proportional,
  useTablePagination,
  paginateData,
} from "@astryxdesign/core/Table";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { formatNumber } from "@/utils/formatters";
import { type ItemLogEntry, type RequirementReportItem, getItemLog } from "@/db/services";

interface LogRow extends ItemLogEntry, Record<string, unknown> {}

interface TransactionHistoryCardProps {
  projectId: string;
  item: RequirementReportItem;
  isOpen: boolean;
}

export function TransactionHistoryCard({ projectId, item, isOpen }: TransactionHistoryCardProps) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ItemLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (isOpen && item) {
      setPage(1);
      getItemLog(projectId, item.item_id, item.requirement_group_id ?? null)
        .then(setLogs)
        .catch(() => setLogs([]));
    }
  }, [isOpen, projectId, item]);

  const paginatedLogs = useMemo(() => paginateData(logs, page, pageSize), [logs, page, pageSize]);

  const paginationPlugin = useTablePagination<LogRow>({
    page,
    onPageChange: setPage,
    totalItems: logs.length,
    pageSize,
    variant: "pages",
    size: "sm",
  });

  const logIndexPlugin = useTableRowIndex({
    data: paginatedLogs as LogRow[],
    getRowKey: (logItem: LogRow) => logItem.id,
    startFrom: (page - 1) * pageSize + 1,
  });

  const columns: TableColumn<LogRow>[] = useMemo(
    () => [
      {
        header: "Tanggal",
        key: "date",
        width: pixel(100),
        renderCell: (row) => <Timestamp value={row.date} format="system_date" size="base" />,
      },
      {
        header: "",
        key: "type",
        width: pixel(60),
        renderCell: (row) => (
          <Badge variant={row.type === "Order" ? "blue" : "green"} label={row.type === "Order" ? "PO" : "NP"} />
        ),
      },
      {
        header: "Referensi",
        key: "reference",
        width: pixel(140),
        renderCell: (row) => {
          const targetUrl = row.type === "Order" ? `/order/${row.id}` : `/receipt/${row.id}/edit`;

          return (
            <Link
              onClick={() => {
                navigate({ to: targetUrl });
              }}
            >
              <Text type="code">{row.reference}</Text>
            </Link>
          );
        },
      },
      {
        align: "end",
        header: "Volume",
        key: "qty",
        width: pixel(80),
        renderCell: (row) => <Text type="code">{formatNumber(row.qty, "volume")}</Text>,
      },
      {
        header: "Vendor",
        key: "vendor",
        width: proportional(1),
        renderCell: (row) => row.vendor_name ?? "-",
      },
    ],
    [navigate],
  );

  return (
    <Card>
      <Layout
        height="auto"
        header={
          <LayoutHeader hasDivider>
            <Heading level={4}>Riwayat Transaksi</Heading>
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={0}>
            <Table
              hasHover
              textOverflow="truncate"
              columns={columns}
              data={paginatedLogs as LogRow[]}
              idKey="id"
              plugins={{ rowIndex: logIndexPlugin, pagination: paginationPlugin }}
              emptyState={<EmptyState isCompact title="Belum ada riwayat transaksi" />}
            />
          </LayoutContent>
        }
      />
    </Card>
  );
}
