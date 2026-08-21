import { Pencil, Trash2 } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
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
      key: "item_code_full",
      width: pixel(160),
      renderCell: (row) => {
        if (row.isFooter) return null;
        const code = formatItemCode(row);
        return code ? <EntityCode id={code} /> : "-";
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(2),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return <Text weight="medium">{row.item_name || "-"}</Text>;
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
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return row.unit ?? "-";
      },
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(120),
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
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(160),
      renderCell: (row) => {
        if (row.isFooter) return null;
        return <Text type="code">{formatNumber((row.qty ?? 0) * (row.price ?? 0))}</Text>;
      },
    },
    {
      align: "end",
      header: "PPn (12%)",
      key: "has_tax",
      width: pixel(130),
      renderCell: (row) => {
        if (row.isFooter) return null;
        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        const taxAmount = row.has_tax ? subtotal * 0.12 : 0;
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
      width: pixel(160),
      renderCell: (row) => {
        if (row.isFooter) return null;
        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        const total = row.has_tax ? subtotal * 1.12 : subtotal;
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
      width: pixel(100),
      renderCell: (row) => {
        if (row.isFooter) return null;

        return (
          <HStack gap={2} justify="end">
            <IconButton
              size="sm"
              variant="secondary"
              label="Edit"
              icon={<Pencil size={16} />}
              onClick={() => onEdit(row)}
            />
            <IconButton
              size="sm"
              variant="destructive"
              label="Hapus"
              icon={<Trash2 size={16} />}
              onClick={() => setDeleteTarget(row.order_item_id)}
            />
          </HStack>
        );
      },
    },
  ];

  return columns;
}
