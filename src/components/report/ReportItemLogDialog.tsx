import { useEffect, useMemo, useState } from "react";
import { Code, Dialog, HStack, Heading, IconButton, Table, Text, Timestamp, VStack } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional, useTablePagination, paginateData } from "@astryxdesign/core/Table";
import { formatNumber } from "@/utils/formatters";
import { type ItemLogEntry, getItemLog } from "@/db/services";
import { X } from "lucide-react";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";

interface LogRow extends ItemLogEntry, Record<string, unknown> {}

interface DashboardItemLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  itemId: string;
  itemPriceId: string;
  itemName: string;
}

export function ReportItemLogDialog({
  isOpen,
  onClose,
  projectId,
  itemId,
  itemPriceId,
  itemName,
}: DashboardItemLogDialogProps) {
  const [logs, setLogs] = useState<ItemLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setLoading(true);
      getItemLog(projectId, itemId, itemPriceId)
        .then(setLogs)
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId, itemId, itemPriceId]);

  const columns: TableColumn<LogRow>[] = [
    {
      header: "Tanggal",
      key: "date",
      width: pixel(120),
      renderCell: (r: LogRow) => <Timestamp value={r.date} format="system_date" size="base" />,
    },
    {
      header: "Referensi",
      key: "reference",
      width: pixel(120),
      renderCell: (r: LogRow) => <Code style={{ background: "transparent", padding: 0 }}>{r.reference}</Code>,
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(100),
      renderCell: (r: LogRow) => <Text type="code">{formatNumber(r.qty)}</Text>,
    },
    {
      header: "Vendor",
      key: "vendor",
      width: proportional(1),
      renderCell: (r: LogRow) => <Text>{r.vendor_name ?? "-"}</Text>,
    },
  ];

  const paginatedLogs = useMemo(() => {
    return paginateData(logs, page, pageSize);
  }, [logs, page, pageSize]);

  const paginationPlugin = useTablePagination<LogRow>({
    page,
    onPageChange: setPage,
    totalItems: logs.length,
    pageSize,
    variant: "pages",
    size: "sm",
  });

  const rowIndexPlugin = useTableRowIndex({
    data: paginatedLogs as LogRow[],
    getRowKey: (item) => item.reference,
    label: "#",
    startFrom: (page - 1) * pageSize + 1,
  });

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={700}>
      <VStack gap={4}>
        <HStack align="center" justify="between">
          <Heading level={3}>Log: {itemName}</Heading>
          <IconButton
            icon={<X size={16} />}
            variant="secondary"
            type="button"
            label="Tutup"
            onClick={() => onClose()}
          />
        </HStack>
        <Table
          textOverflow="truncate"
          columns={columns}
          data={paginatedLogs as LogRow[]}
          idKey="reference"
          plugins={{ rowIndex: rowIndexPlugin, pagination: paginationPlugin }}
        />
        {logs.length === 0 && !loading && (
          <VStack align="center" style={{ marginTop: 16 }}>
            <Text color="secondary">Belum ada log Pemesanan atau Penerimaan untuk item ini.</Text>
          </VStack>
        )}
      </VStack>
    </Dialog>
  );
}
