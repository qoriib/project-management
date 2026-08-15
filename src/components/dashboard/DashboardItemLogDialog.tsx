import { useEffect, useState } from "react";
import { Dialog, Table, Text, VStack, Heading, Timestamp, HStack, IconButton, Code } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { getDashboardItemLog, type DashboardItemLogEntry } from "@/db/services";
import { formatNumber } from "@/utils/formatters";
import { X } from "lucide-react";

type LogRow = DashboardItemLogEntry & Record<string, unknown>;

interface DashboardItemLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  itemId: number;
  itemPriceId: number;
  itemName: string;
}

export function DashboardItemLogDialog({
  isOpen,
  onClose,
  projectId,
  itemId,
  itemPriceId,
  itemName
}: DashboardItemLogDialogProps) {
  const [logs, setLogs] = useState<DashboardItemLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getDashboardItemLog(projectId, itemId, itemPriceId)
        .then(setLogs)
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId, itemId, itemPriceId]);

  const columns: TableColumn<LogRow>[] = [
    {
      key: "date",
      header: "Tanggal",
      width: pixel(120),
      renderCell: (r: LogRow) => <Timestamp value={r.date} format="system_date" size="base" />
    },
    {
      key: "reference",
      header: "Referensi",
      width: pixel(120),
      renderCell: (r: LogRow) => <Code style={{ background: "transparent", padding: 0 }}>{r.reference}</Code>,
    },
    {
      key: "qty",
      header: "Volume",
      width: pixel(100),
      renderCell: (r: LogRow) => (
        <Text>{formatNumber(r.qty, 2)}</Text>
      )
    },
    {
      key: "vendor",
      header: "Vendor",
      width: proportional(1),
      renderCell: (r: LogRow) => (
        <Text>{r.vendor_name || '-'}</Text>
      )
    }
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      width={700}
    >
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
