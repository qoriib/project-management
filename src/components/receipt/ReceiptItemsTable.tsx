import { Card, EmptyState, Table, Text, TextInput } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode, formatNumber, sanitizeDecimalInput } from "@/utils/formatters";
import { type TableColumn, pixel, proportional, useTableStickyColumns } from "@astryxdesign/core/Table";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import type { ReceiptItemDetail } from "@/store/useReceiptStore";

export interface ReceiptItemsTableProps {
  items: ReceiptItemDetail[];
  /** Nilai qty yang dikontrol dari luar (dari form state parent) */
  qtyValues: Record<string, string>;
  onQtyChange: (orderItemId: string, value: string) => void;
}

export function ReceiptItemsTable({ items, qtyValues, onQtyChange }: ReceiptItemsTableProps) {
  const columns: TableColumn<ReceiptItemDetail>[] = [
    {
      header: "Kode Item",
      key: "item_code",
      width: pixel(140),
      renderCell: (row) => {
        const code = formatItemCode(row);
        return <EntityCode id={code} />;
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(1, { minWidth: 240 }),
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
      header: "Harga (Rp)",
      key: "price",
      width: pixel(140),
      renderCell: (row) => <Text type="code">{formatNumber(row.price ?? 0, "currency")}</Text>,
    },
    {
      align: "end",
      header: "Volume PO",
      key: "ordered",
      width: pixel(130),
      renderCell: (row) => <Text type="code">{formatNumber(row.ordered ?? 0, "volume")}</Text>,
    },
    {
      align: "end",
      header: "Sudah Diterima",
      key: "delivered",
      width: pixel(130),
      renderCell: (row) => (
        <Text type="code" color="secondary">
          {formatNumber(row.delivered ?? 0, "volume")}
        </Text>
      ),
    },
    {
      align: "end",
      header: "Sisa PO",
      key: "remaining",
      width: pixel(130),
      renderCell: (row) => {
        const sisa = row.remaining ?? 0;
        return (
          <Text type="code" weight={sisa > 0 ? "bold" : "normal"} color={sisa > 0 ? "primary" : "secondary"}>
            {formatNumber(sisa, "volume")}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Diterima (NP)",
      key: "qty",
      width: pixel(160),
      renderCell: (row) => (
        <TextInput
          label="Volume Diterima"
          isLabelHidden
          value={qtyValues[row.order_item_id] ?? String(row.qty ?? "")}
          onChange={(val) => onQtyChange(row.order_item_id, sanitizeDecimalInput(val))}
        />
      ),
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: items,
    getRowKey: (item) => item.order_item_id,
  });

  const stickyColumns = useTableStickyColumns<ReceiptItemDetail>({
    startKeys: ["__rowIndex", "item_code", "item_name"],
    endKeys: ["qty"],
  });

  return (
    <Card>
      <Table
        hasHover
        idKey="order_item_id"
        textOverflow="truncate"
        columns={columns}
        data={items}
        plugins={{ rowIndex: rowIndexPlugin, stickyColumns }}
        emptyState={<EmptyState isCompact title="Tidak ada item untuk diterima" />}
      />
    </Card>
  );
}
