import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { HStack, IconButton, Text, Timestamp, Token } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { type ReceiptSummary } from "@/db/repositories";

export interface ReceiptRow extends ReceiptSummary, Record<string, unknown> { }

interface UseReceiptColumnsProps {
  setDeletingId: (id: string | null) => void;
}

export function useReceiptColumns({ setDeletingId }: UseReceiptColumnsProps) {
  const navigate = useNavigate();

  const columns: TableColumn<ReceiptRow>[] = [
    {
      header: "No. NP",
      key: "receipt_code",
      width: pixel(140),
      renderCell: (row) => <EntityCode id={row.receipt_code} />,
    },
    {
      header: "Tanggal",
      key: "receipt_date",
      width: pixel(120),
      renderCell: (row) => <Timestamp value={row.receipt_date} format="system_date" size="base" />,
    },
    {
      header: "No. PO",
      key: "order_code",
      width: pixel(140),
      renderCell: (row) => <EntityCode id={row.order_code} />,
    },
    {
      header: "Vendor",
      key: "vendor_names",
      width: proportional(1, { minWidth: 240 }),
      renderCell: (row: ReceiptRow) =>
        row?.vendor_names && row.vendor_names.length > 0 ? (
          <HStack gap={1} wrap="wrap">
            {row.vendor_names.map((v, idx) => (
              <Token key={idx} label={v} />
            ))}
          </HStack>
        ) : (
          "-"
        ),
    },
    {
      align: "end",
      header: "Total Item",
      key: "item_count",
      width: pixel(100),
      renderCell: (row) => <Text type="code">{row.item_count}</Text>,
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(120),
      renderCell: (row) => (
        <HStack justify="end" gap={2}>
          <IconButton
            size="sm"
            variant="secondary"
            label="Edit"
            icon={<Pencil />}
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
            icon={<Trash2 />}
            onClick={() => setDeletingId(row.receipt_id)}
          />
        </HStack>
      ),
    },
  ];

  return columns;
}
