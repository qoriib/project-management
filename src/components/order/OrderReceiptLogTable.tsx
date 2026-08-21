import { useNavigate } from "@tanstack/react-router";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text, Timestamp } from "@astryxdesign/core";
import { Pencil } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { useOrderStore } from "@/store/useOrderStore";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { Table, type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { ReceiptItemByOrder } from "@/db/repositories";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";

type LogRow = ReceiptItemByOrder & Record<string, unknown>;

export function OrderReceiptLogTable() {
  const navigate = useNavigate();
  const { currentReceiptItems: receiptItems } = useOrderStore();

  const receiptColumns: TableColumn<LogRow>[] = [
    {
      header: "No. NP",
      key: "receipt_code",
      width: pixel(160),
      renderCell: (row) => <EntityCode id={row.receipt_code} />,
    },
    {
      header: "Tanggal Kirim",
      key: "receipt_date",
      width: pixel(120),
      renderCell: (row) => <Timestamp value={row.receipt_date} format="system_date" size="base" />,
    },
    {
      header: "Item",
      key: "item_name",
      width: proportional(4),
      renderCell: (row) => row.item_name || "-",
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => row.unit || "-",
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(140),
      renderCell: (row) => <Text type="code">{formatNumber(row.qty)}</Text>,
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: proportional(1),
      renderCell: (row) => (
        <IconButton
          size="sm"
          variant="secondary"
          label="Edit"
          icon={<Pencil size={16} />}
          onClick={() => navigate({ to: `/receipt/${row.receipt_id}/edit` })}
        />
      ),
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: receiptItems as LogRow[],
    getRowKey: (item) => item.receipt_item_id,
    label: "#",
  });

  return (
    <Table
      hasHover
      idKey="receipt_item_id"
      textOverflow="truncate"
      columns={receiptColumns}
      data={receiptItems as LogRow[]}
      plugins={{ rowIndex: rowIndexPlugin }}
      emptyState={<TableEmptyState message="Belum ada realisasi Penerimaan Item untuk Order ini." />}
    />
  );
}
