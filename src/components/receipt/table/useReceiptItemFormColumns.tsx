import { Pencil, Trash2 } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { calcDPP, calcTax, calcLineTotal, TAX_RATIO_PERCENT } from "@/utils/calc";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { ReceiptItemDetail } from "@/db/repositories";

export type ReceiptItemRow = ReceiptItemDetail & Record<string, unknown>;

interface UseReceiptItemFormColumnsProps {
  onEdit: (item: ReceiptItemDetail) => void;
  setDeleteTarget: (id: string | null) => void;
}

export function useReceiptItemFormColumns({ onEdit, setDeleteTarget }: UseReceiptItemFormColumnsProps) {
  const columns: TableColumn<ReceiptItemRow>[] = [
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
      width: proportional(1, { minWidth: 260 }),
      renderCell: (row) => row.item_name || "-",
    },
    {
      header: "Vendor",
      key: "vendor",
      width: pixel(200),
      renderCell: (row) => row.vendor_name ?? "-",
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => row.unit || "-",
    },
    {
      align: "end",
      header: "Volume Diterima",
      key: "qty",
      width: pixel(140),
      renderCell: (row) => <Text type="code">{formatNumber(row.qty, "volume")}</Text>,
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(160),
      renderCell: (row) => <Text type="code">{formatNumber(row.price, "currency")}</Text>,
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(160),
      renderCell: (row) => {
        const subtotal = (row.qty ?? 0) * (row.price ?? 0);
        return <Text type="code">{formatNumber(subtotal, "currency")}</Text>;
      },
    },
    {
      align: "end",
      header: `PPn (${TAX_RATIO_PERCENT}%)`,
      key: "has_tax",
      width: pixel(140),
      renderCell: (row) => {
        const dpp = calcDPP(row.qty, row.price);
        const taxAmount = calcTax(dpp, row.has_tax);
        return row.has_tax ? <Text type="code">{formatNumber(taxAmount, "currency")}</Text> : "-";
      },
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total",
      width: pixel(160),
      renderCell: (row) => {
        const dpp = calcDPP(row.qty, row.price);
        const total = calcLineTotal(dpp, row.has_tax);
        return (
          <Text type="code" weight="bold">
            {formatNumber(total, "currency")}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(100),
      renderCell: (row) => (
        <HStack gap={2} justify="end">
          <IconButton size="sm" variant="secondary" label="Edit" icon={<Pencil />} onClick={() => onEdit(row)} />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 />}
            onClick={() => setDeleteTarget(row.receipt_item_id)}
          />
        </HStack>
      ),
    },
  ];

  return columns;
}
