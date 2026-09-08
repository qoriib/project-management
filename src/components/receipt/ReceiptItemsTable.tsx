import { useEffect, useState } from "react";
import { Card, EmptyState, Table, Text, TextInput } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { EntityCode } from "@/components/shared/EntityCode";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { formatItemCode, formatNumber, parseDecimalInput, sanitizeDecimalInput } from "@/utils/formatters";
import { handleFormError } from "@/utils/form";
import { useReceiptStore } from "@/store/useReceiptStore";
import { type TableColumn, pixel, proportional, useTableStickyColumns } from "@astryxdesign/core/Table";
import type { ReceiptItemRow } from "./form/receipt.schema";

export interface ReceiptItemsTableProps {
  items: ReceiptItemRow[];
  receiptId: string;
  orderId: string;
  onItemUpdated?: () => void;
}

export function ReceiptItemsTable({ items, receiptId, orderId, onItemUpdated }: ReceiptItemsTableProps) {
  const showToast = useToast();
  const { upsertReceiptItem } = useReceiptStore();

  const [qtyValues, setQtyValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const item of items) {
      initial[item.order_item_id] = String(item.qty ?? "");
    }
    setQtyValues(initial);
  }, [items]);

  const columns: TableColumn<ReceiptItemRow>[] = [
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
      header: "Volume PO",
      key: "ordered",
      width: pixel(130),
      renderCell: (row) => (
        <Text type="code" weight="medium">
          {formatNumber(row.ordered ?? 0, 5)}
        </Text>
      ),
    },
    {
      align: "end",
      header: "Sudah Diterima",
      key: "delivered",
      width: pixel(130),
      renderCell: (row) => (
        <Text type="code" color="secondary">
          {formatNumber(row.delivered ?? 0, 5)}
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
            {formatNumber(sisa, 5)}
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
          onChange={(v) => {
            setQtyValues((prev) => ({
              ...prev,
              [row.order_item_id]: sanitizeDecimalInput(v),
            }));
          }}
          onBlur={async () => {
            const currentVal = qtyValues[row.order_item_id] ?? String(row.qty ?? "");
            try {
              const numQty = parseDecimalInput(currentVal);
              await upsertReceiptItem(receiptId, orderId, row.order_item_id, numQty);
              onItemUpdated?.();
            } catch (error: unknown) {
              handleFormError(error, showToast);
            }
          }}
        />
      ),
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(160),
      renderCell: (row) => <Text type="code">{formatNumber(row.price ?? 0, 2)}</Text>,
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: items,
    getRowKey: (item) => item.order_item_id,
  });

  const stickyColumns = useTableStickyColumns<ReceiptItemRow>({
    startKeys: ["__rowIndex", "item_code", "item_name"],
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
