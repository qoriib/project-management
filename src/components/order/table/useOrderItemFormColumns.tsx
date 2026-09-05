import { Pencil, Trash2 } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { calcDPP, calcTax, calcLineTotal, TAX_RATIO_PERCENT } from "@/utils/calc";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { OrderItemDetail } from "@/db/repositories";

export interface OrderItemRow extends OrderItemDetail, Record<string, unknown> {
  isFooter?: boolean;
}

interface UseOrderItemFormColumnsProps {
  onEdit: (item: OrderItemDetail) => void;
  setDeleteTarget: (id: string | null) => void;
}

export function useOrderItemFormColumns({ onEdit, setDeleteTarget }: UseOrderItemFormColumnsProps) {
  const columns: TableColumn<OrderItemRow>[] = [
    {
      header: "Kode Item",
      key: "item_code",
      width: pixel(140),
      renderCell: (row) => {
        if (row.isFooter) return null;
        const code = formatItemCode(row);
        return code ? <EntityCode id={code} /> : "-";
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(1, { minWidth: 280 }),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return row.item_name || "-";
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return row.unit || "-";
      },
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(140),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return (
          <Text type="code" weight="medium">
            {formatNumber(row.qty)}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(180),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return <Text type="code">{formatNumber(row.price)}</Text>;
      },
    },
    {
      header: "Vendor",
      key: "vendor",
      width: pixel(200),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return row.vendor_name ?? "-";
      },
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(180),
      renderCell: (row) => {
        if (row.isFooter) return null;
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
        if (row.isFooter) return null;
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
      header: "Aksi",
      key: "actions",
      width: pixel(120),
      renderCell: (row) => {
        if (row.isFooter) return null;

        return (
          <HStack gap={2} justify="end">
            <IconButton size="sm" variant="secondary" label="Edit" icon={<Pencil />} onClick={() => onEdit(row)} />
            <IconButton
              size="sm"
              variant="destructive"
              label="Hapus"
              icon={<Trash2 />}
              onClick={() => setDeleteTarget(row.order_item_id)}
            />
          </HStack>
        );
      },
    },
  ];

  return columns;
}
