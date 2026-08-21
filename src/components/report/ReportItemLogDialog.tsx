import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Card,
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
import { type TableColumn, pixel, proportional, useTablePagination, paginateData } from "@astryxdesign/core/Table";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import {
  type ItemLogEntry,
  type RequirementReportItem,
  type RequirementReportVariant,
  getItemLog,
} from "@/db/services";
import { X } from "lucide-react";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { EntityCode } from "@/components/shared/EntityCode";

interface LogRow extends ItemLogEntry, Record<string, unknown> {}

interface VariantRow extends RequirementReportVariant, Record<string, unknown> {
  unique_id: string;
}

interface ReportItemLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  item: RequirementReportItem;
}

export function ReportItemLogDialog({ isOpen, onClose, projectId, item }: ReportItemLogDialogProps) {
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

  const logColumns: TableColumn<LogRow>[] = [
    {
      header: "Tanggal",
      key: "date",
      width: pixel(110),
      renderCell: (r: LogRow) => <Timestamp value={r.date} format="system_date" size="base" />,
    },
    {
      header: "Tipe",
      key: "type",
      width: pixel(75),
      renderCell: (r: LogRow) => (
        <Badge variant={r.type === "Order" ? "accent" : "green"} label={r.type === "Order" ? "PO" : "NP"} />
      ),
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
      width: pixel(90),
      renderCell: (r: LogRow) => <Text type="code">{formatNumber(r.qty)}</Text>,
    },
    {
      header: "Vendor",
      key: "vendor",
      width: proportional(1),
      renderCell: (r: LogRow) => <Text>{r.vendor_name ?? "-"}</Text>,
    },
  ];

  // BOM Columns (without Vendor)
  const bomVariantColumns: TableColumn<VariantRow>[] = [
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(140),
      renderCell: (r: VariantRow) => <Text type="code">{formatNumber(r.price)}</Text>,
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(100),
      renderCell: (r: VariantRow) => <Text type="code">{formatNumber(r.qty)}</Text>,
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "dpp",
      width: pixel(140),
      renderCell: (r: VariantRow) => <Text type="code">{formatNumber(r.dpp)}</Text>,
    },
    {
      align: "end",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(120),
      renderCell: (r: VariantRow) => <Text type="code">{r.has_tax === 1 ? formatNumber(r.tax_amount) : "-"}</Text>,
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "subtotal",
      width: pixel(150),
      renderCell: (r: VariantRow) => (
        <Text type="code" weight="bold">
          {formatNumber(r.subtotal)}
        </Text>
      ),
    },
  ];

  // PO Columns (with Vendor)
  const poVariantColumns: TableColumn<VariantRow>[] = [
    {
      header: "Vendor",
      key: "vendor",
      width: proportional(2),
      renderCell: (r: VariantRow) => <Text weight="medium">{r.vendor_name || "-"}</Text>,
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(140),
      renderCell: (r: VariantRow) => <Text type="code">{formatNumber(r.price)}</Text>,
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(90),
      renderCell: (r: VariantRow) => <Text type="code">{formatNumber(r.qty)}</Text>,
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "dpp",
      width: pixel(140),
      renderCell: (r: VariantRow) => <Text type="code">{formatNumber(r.dpp)}</Text>,
    },
    {
      align: "end",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(120),
      renderCell: (r: VariantRow) => <Text type="code">{r.has_tax === 1 ? formatNumber(r.tax_amount) : "-"}</Text>,
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "subtotal",
      width: pixel(150),
      renderCell: (r: VariantRow) => (
        <Text type="code" weight="bold">
          {formatNumber(r.subtotal)}
        </Text>
      ),
    },
  ];

  const plannedRows: VariantRow[] = useMemo(
    () =>
      (item.planned_variants || []).map((v, i) => ({
        ...v,
        unique_id: `plan-${v.item_price_id}-${i}`,
      })),
    [item.planned_variants],
  );

  const orderRows: VariantRow[] = useMemo(
    () =>
      (item.order_variants || []).map((v, i) => ({
        ...v,
        unique_id: `order-${v.item_price_id}-${i}`,
      })),
    [item.order_variants],
  );

  const plannedIndexPlugin = useTableRowIndex({
    data: plannedRows,
    getRowKey: (row: VariantRow) => row.unique_id,
    label: "#",
  });

  const orderIndexPlugin = useTableRowIndex({
    data: orderRows,
    getRowKey: (row: VariantRow) => row.unique_id,
    label: "#",
  });

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

  const logIndexPlugin = useTableRowIndex({
    data: paginatedLogs as LogRow[],
    getRowKey: (logItem) => logItem.reference,
    label: "#",
    startFrom: (page - 1) * pageSize + 1,
  });

  const itemCode = formatItemCode(item);

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={850}>
      <VStack gap={4}>
        {/* Header */}
        <HStack align="center" justify="between">
          <VStack gap={0.5}>
            <HStack align="center" gap={2}>
              <Heading level={3}>{item.item_name}</Heading>
              {itemCode && <EntityCode id={itemCode} />}
            </HStack>
            <HStack align="center" gap={2}>
              <Badge variant="accent" label={item.category || "LAINNYA"} />
              <Badge label={`Satuan: ${item.unit || "-"}`} />
              {item.is_unplanned && <Badge variant="red" label="Di Luar Rencana (Unplanned)" />}
            </HStack>
          </VStack>
          <IconButton
            icon={<X size={16} />}
            variant="secondary"
            type="button"
            label="Tutup"
            onClick={() => onClose()}
          />
        </HStack>

        {/* Card 1: Kebutuhan (BOM) */}
        <Card padding={3}>
          <VStack gap={2.5}>
            <HStack justify="between" align="center">
              <Heading level={4}>Kebutuhan (BOM)</Heading>
              <Text size="sm" color="secondary">
                Total Budget:{" "}
                <Text weight="bold" type="code">
                  {formatNumber(item.planned_budget)}
                </Text>
              </Text>
            </HStack>
            {plannedRows.length > 0 ? (
              <Table
                textOverflow="truncate"
                columns={bomVariantColumns}
                data={plannedRows}
                idKey="unique_id"
                plugins={{ rowIndex: plannedIndexPlugin }}
              />
            ) : (
              <VStack align="center" padding={2}>
                <Text size="sm" color="secondary">
                  Tidak ada data kebutuhan (BOM) untuk item ini.
                </Text>
              </VStack>
            )}
          </VStack>
        </Card>

        {/* Card 2: Pemesanan (PO) */}
        <Card padding={3}>
          <VStack gap={2.5}>
            <HStack justify="between" align="center">
              <Heading level={4}>Pemesanan (PO)</Heading>
              <Text size="sm" color="secondary">
                Total Pemesanan:{" "}
                <Text weight="bold" type="code">
                  {formatNumber(item.total_order_price)}
                </Text>
              </Text>
            </HStack>
            {orderRows.length > 0 ? (
              <Table
                textOverflow="truncate"
                columns={poVariantColumns}
                data={orderRows}
                idKey="unique_id"
                plugins={{ rowIndex: orderIndexPlugin }}
              />
            ) : (
              <VStack align="center" padding={2}>
                <Text size="sm" color="secondary">
                  Belum ada pemesanan (PO) untuk item ini.
                </Text>
              </VStack>
            )}
          </VStack>
        </Card>

        {/* Card 3: Riwayat Transaksi */}
        <Card padding={3}>
          <VStack gap={2.5}>
            <Heading level={4}>Riwayat Transaksi (PO & NP)</Heading>
            <Table
              textOverflow="truncate"
              columns={logColumns}
              data={paginatedLogs as LogRow[]}
              idKey="reference"
              plugins={{ rowIndex: logIndexPlugin, pagination: paginationPlugin }}
            />
            {logs.length === 0 && !loading && (
              <VStack align="center" padding={2}>
                <Text size="sm" color="secondary">
                  Belum ada log Pemesanan atau Penerimaan untuk item ini.
                </Text>
              </VStack>
            )}
          </VStack>
        </Card>
      </VStack>
    </Dialog>
  );
}
