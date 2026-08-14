import { useEffect, useState } from "react";
import { Dialog, Table, Text, VStack, Badge } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { getDashboardItemLog, type DashboardItemLogEntry } from "@/db/services";
import { formatNumber, formatDate } from "@/utils/formatters";

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

  return (
    <Dialog 
      isOpen={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      width={700}
    >
      <VStack gap={4}>
        <PageHeader title={`Log Item: ${itemName}`} />
        <Table
          columns={[
            {
              key: "date",
              header: "Tanggal",
              width: pixel(120),
              renderCell: (r: any) => (
                <Text size="sm">{formatDate(r.date)}</Text>
              )
            },
            {
              key: "type",
              header: "Tipe",
              width: pixel(100),
              renderCell: (r: any) => (
                <Badge variant={r.type === 'PO' ? 'info' : 'success'} label={r.type} />
              )
            },
            {
              key: "reference",
              header: "Referensi",
              width: proportional(1),
              renderCell: (r: any) => (
                <Text weight="medium">{r.reference}</Text>
              )
            },
            {
              key: "qty",
              header: "Volume",
              width: pixel(100),
              renderCell: (r: any) => (
                <Text>{formatNumber(r.qty, 2)}</Text>
              )
            },
            {
              key: "vendor",
              header: "Vendor",
              width: proportional(1),
              renderCell: (r: any) => (
                <Text>{r.vendor_name || '-'}</Text>
              )
            }
          ]}
          data={logs as any}
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
