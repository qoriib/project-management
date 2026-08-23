import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Heading, Text, Timestamp, VStack } from "@astryxdesign/core";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import {
  Table,
  type TableColumn,
  pixel,
  proportional,
  useTablePagination,
  paginateData,
  useTableRowIndex,
} from "@astryxdesign/core/Table";
import { formatNumber } from "@/utils/formatters";
import { type ItemLogEntry, type RequirementReportItem, getItemLog } from "@/db/services";

interface LogRow extends ItemLogEntry, Record<string, unknown> {}

interface TransactionHistoryCardProps {
  projectId: string;
  item: RequirementReportItem;
  isOpen: boolean;
}

export function TransactionHistoryCard({ projectId, item, isOpen }: TransactionHistoryCardProps) {
  const [logs, setLogs] = useState<ItemLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (isOpen && item) {
      setPage(1);
      setLoading(true);
      getItemLog(projectId, item.item_id)
        .then(setLogs)
        .finally(() => setLoading(false));
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
    label: "#",
    startFrom: (page - 1) * pageSize + 1,
  });

  const columns: TableColumn<LogRow>[] = [
    {
      header: "Tanggal",
      key: "date",
      width: pixel(110),
      renderCell: (r) => <Timestamp value={r.date} format="system_date" size="base" />,
    },
    {
      header: "Tipe",
      key: "type",
      width: pixel(75),
      renderCell: (r) => (
        <Badge variant={r.type === "Order" ? "blue" : "green"} label={r.type === "Order" ? "PO" : "NP"} />
      ),
    },
    {
      header: "Referensi",
      key: "reference",
      width: pixel(120),
      renderCell: (r) => <Text type="code">{r.reference}</Text>,
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(90),
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
      <VStack gap={3}>
        <Heading level={4}>Riwayat Transaksi (PO & NP)</Heading>
        <Table
          hasHover
          density="compact"
          textOverflow="truncate"
          columns={columns}
          data={paginatedLogs as LogRow[]}
          idKey="reference"
          plugins={{ rowIndex: logIndexPlugin, pagination: paginationPlugin }}
        />
        {logs.length === 0 && !loading && (
          <EmptyState
            title="Belum ada transaksi"
            description="Belum ada log Pemesanan atau Penerimaan untuk item ini."
            isCompact
          />
        )}
      </VStack>
    </Card>
  );
}
