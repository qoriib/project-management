import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { HStack, IconButton, Timestamp, Token, OverflowList } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { type ReceiptSummary } from "@/db/repositories";

export interface ReceiptRow extends ReceiptSummary, Record<string, unknown> {}

interface UseReceiptColumnsProps {
  setDeletingId: (id: string | null) => void;
}

export function useReceiptColumns({ setDeletingId }: UseReceiptColumnsProps) {
  const navigate = useNavigate();

  const columns: TableColumn<ReceiptRow>[] = [
    {
      header: "No. NP",
      key: "receipt_code",
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
      header: "No. PO",
      key: "order_code",
      width: pixel(180),
      renderCell: (row) => <EntityCode id={row.order_code} />,
    },
    {
      header: "Item",
      key: "item_names",
      width: proportional(1, { minWidth: 260 }),
      renderCell: (row: ReceiptRow) => {
        const items = row.item_names || [];
        if (items.length === 0) return "-";
        return (
          <OverflowList
            gap={1}
            minVisibleItems={1}
            overflowRenderer={(overflowItems) => <Token label={`+${overflowItems.length}`} />}
          >
            {items.map((item, idx) => (
              <Token key={idx} label={item} />
            ))}
          </OverflowList>
        );
      },
    },
    {
      header: "Vendor",
      key: "vendor_names",
      width: proportional(1, { minWidth: 220 }),
      renderCell: (row: ReceiptRow) => {
        const vendors = row.vendor_names || [];
        if (vendors.length === 0) return "-";
        return (
          <OverflowList
            gap={1}
            minVisibleItems={1}
            overflowRenderer={(overflowItems) => <Token label={`+${overflowItems.length}`} />}
          >
            {vendors.map((v, idx) => (
              <Token key={idx} label={v} />
            ))}
          </OverflowList>
        );
      },
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
