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
      getItemLog(projectId, item.item_id)
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
    getRowKey: (logItem) => logItem.reference,
    startFrom: (page - 1) * pageSize + 1,
  });

  const columns: TableColumn<LogRow>[] = [
    {
      header: "Tanggal",
      key: "date",
      width: pixel(100),
      renderCell: (r) => <Timestamp value={r.date} format="system_date" size="base" />,
    },
    {
      header: "Tipe",
      key: "type",
      width: pixel(60),
      renderCell: (r) => (
        <Badge variant={r.type === "Order" ? "blue" : "green"} label={r.type === "Order" ? "PO" : "NP"} />
      ),
    },
    {
      header: "Referensi",
      key: "reference",
      width: pixel(140),
      renderCell: (r) => {
        if (!r.id) {
          return <Text type="code">{r.reference}</Text>;
        }
        const targetUrl = r.type === "Order" ? `/order/${r.id}` : `/receipt/${r.id}/edit`;
        return (
          <Link
            onClick={() => {
              navigate({ to: targetUrl });
            }}
          >
            <Text type="code">{r.reference}</Text>
          </Link>
        );
      },
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(80),
      renderCell: (r) => <Text type="code">{formatNumber(r.qty)}</Text>,
    },
    {
      header: "Vendor",
      key: "vendor",
      width: proportional(1),
      renderCell: (r) => <Text>{r.vendor_name ?? "-"}</Text>,
    },
  ];

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
              idKey="reference"
              plugins={{ rowIndex: logIndexPlugin, pagination: paginationPlugin }}
              emptyState={<EmptyState isCompact title="Belum ada riwayat transaksi" />}
            />
          </LayoutContent>
        }
      />
    </Card>
  );
}
