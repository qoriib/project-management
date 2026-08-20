import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { HStack, IconButton, Text, Timestamp, Token } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { type ReceiptSummary } from "@/db/repositories";

export interface ReceiptRow extends ReceiptSummary, Record<string, unknown> {}

interface UseReceiptColumnsProps {
  setDeleteTarget: (id: string | null) => void;
}

export function useReceiptColumns({ setDeleteTarget }: UseReceiptColumnsProps) {
  const navigate = useNavigate();

  const columns: TableColumn<ReceiptRow>[] = [
    {
      header: "# Penerimaan",
      key: "receipt_id",
      width: pixel(180),
      renderCell: (row) => <EntityCode id={row.receipt_code} />,
    },
    {
      header: "Tanggal",
      key: "receipt_date",
      width: pixel(120),
      renderCell: (row) => <Timestamp value={row.receipt_date} format="system_date" size="base" />,
    },
    {
      header: "Ref. Order",
      key: "order_id",
      width: pixel(180),
      renderCell: (row) => <EntityCode id={row.order_code || row.order_id} />,
    },
    {
      header: "Vendor Pemasok",
      key: "vendor_names",
      width: proportional(3),
      renderCell: (row) => (
        <HStack gap={1} wrap="wrap">
          {row?.vendor_names?.map((v, idx) => (
            <Token key={idx} label={v} />
          ))}
        </HStack>
      ),
    },
    {
      align: "end",
      header: "Total Item",
      key: "item_count",
      width: pixel(140),
      renderCell: (row) => <Text type="code">{row.item_count}</Text>,
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: proportional(1),
      renderCell: (row) => (
        <HStack justify="end" gap={2}>
          <IconButton
            size="sm"
            variant="secondary"
            label="Edit"
            icon={<Pencil size={16} />}
            onClick={() =>
              navigate({
                to: "/receipt/$id/edit",
                params: { id: String(row.receipt_id) },
              })
            }
          />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteTarget(row.receipt_id)}
          />
        </HStack>
      ),
    },
  ];

  return columns;
}
