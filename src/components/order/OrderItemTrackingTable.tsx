import { EmptyState, Table, Text } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { EntityCode } from "@/components/shared/EntityCode";
import { useOrderStore } from "@/store/useOrderStore";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { calcDPP, calcTax, calcLineTotal, TAX_RATIO_PERCENT } from "@/utils/calc";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { OrderItemDetail } from "@/db/repositories";

type TrackingRow = OrderItemDetail & Record<string, unknown>;

export function OrderItemTrackingTable() {
  const { currentItems: items } = useOrderStore();

  const itemColumns: TableColumn<TrackingRow>[] = [
    {
      header: "Kode Item",
      key: "item_code",
      width: pixel(140),
      renderCell: (row) => {
        const code = formatItemCode(row);
        return code ? <EntityCode id={code} /> : "-";
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(1, { minWidth: 280 }),
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
      renderCell: (row) => (
        <Text type="code" weight="medium">
          {formatNumber(row.qty)}
        </Text>
      ),
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(180),
      renderCell: (row) => <Text type="code">{formatNumber(row.price)}</Text>,
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (row) => {
        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        return <Text type="code">{formatNumber(subtotal)}</Text>;
      },
    },
    {
      align: "end",
      header: `PPn (${TAX_RATIO_PERCENT}%)`,
      key: "has_tax",
      width: pixel(180),
      renderCell: (row) => {
        const dpp = calcDPP(row.qty, row.price);
        const taxAmount = calcTax(dpp, row.has_tax);
        return row.has_tax ? (
          <Text type="code">{formatNumber(taxAmount)}</Text>
        ) : (
          <Text size="sm" color="secondary">
            -
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total",
      width: pixel(180),
      renderCell: (row) => {
        const dpp = calcDPP(row.qty, row.price);
        const total = calcLineTotal(dpp, row.has_tax);
        return (
          <Text type="code" weight="bold">
            {formatNumber(total)}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Penerimaan",
      key: "progress",
      width: pixel(200),
      renderCell: (row) => {
        const delivered = row.total_delivered ?? 0;
        const total = row.qty ?? 0;
        const pct = total > 0 ? (delivered / total) * 100 : 0;
        const variant = pct > 100 ? "error" : "success";

        return (
          <ProgressBar
            value={delivered}
            max={total || 1}
            label={`${pct.toFixed(0)}%`}
            hasValueLabel
            formatValueLabel={() => `${formatNumber(delivered)} / ${formatNumber(total)}`}
            variant={variant}
          />
        );
      },
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: items as TrackingRow[],
    getRowKey: (item) => item.order_item_id,
  });

  return (
    <Table
      hasHover
      idKey="order_item_id"
      textOverflow="truncate"
      columns={itemColumns}
      data={items as TrackingRow[]}
      plugins={{ rowIndex: rowIndexPlugin }}
      emptyState={<EmptyState isCompact title="Tidak ada item pesanan" />}
    />
  );
}
