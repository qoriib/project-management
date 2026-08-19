import { useEffect, useState } from "react";
import {
  Code,
  Dialog,
  HStack,
  Heading,
  IconButton,
  Table,
  Text,
  Timestamp,
  VStack,
} from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { type ItemLogEntry, getItemLog } from "@/db/services";
import { formatNumber } from "@/utils/formatters";
import { X } from "lucide-react";

interface LogRow extends ItemLogEntry, Record<string, unknown> {}

interface DashboardItemLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  itemId: string;
  itemPriceId: string;
  itemName: string;
}

export function DashboardItemLogDialog({
  isOpen,
  onClose,
  projectId,
  itemId,
  itemPriceId,
  itemName,
}: DashboardItemLogDialogProps) {
  const [logs, setLogs] = useState<ItemLogEntry[]>([]),
    [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
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
      renderCell: (r: LogRow) => <Timestamp value={r.date} format="system_date" size="base" />,
      width: pixel(120),
    },
    {
      header: "Referensi",
      key: "reference",
      renderCell: (r: LogRow) => (
        <Code style={{ background: "transparent", padding: 0 }}>{r.reference}</Code>
      ),
      width: pixel(120),
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      renderCell: (r: LogRow) => <Text type="code">{formatNumber(r.qty, 2)}</Text>,
      width: pixel(100),
    },
    {
      header: "Vendor",
      key: "vendor",
      renderCell: (r: LogRow) => <Text>{r.vendor_name || "-"}</Text>,
      width: proportional(1),
    },
  ];

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
          data={logs as LogRow[]}
          idKey="reference"
        />
        {logs.length === 0 && !loading && (
          <VStack align="center" style={{ marginTop: 16 }}>
            <Text color="secondary">Belum ada log PO atau Pengiriman untuk item ini.</Text>
          </VStack>
        )}
      </VStack>
    </Dialog>
  );
}
