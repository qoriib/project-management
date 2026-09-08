import { Eye, Pencil, Trash2 } from "lucide-react";
import { HStack, IconButton, Text, Timestamp, Token } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import { useNavigate } from "@tanstack/react-router";
import { EntityCode } from "@/components/shared/EntityCode";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { type OrderWithSummary } from "@/db/repositories";

export interface PORow extends OrderWithSummary, Record<string, unknown> {
  order_code: string;
}

interface UseOrderTableColumnsProps {
  onEdit: (id: string) => void;
  setDeleteTarget: (target: { id: string; label: string } | null) => void;
}

export function useOrderTableColumns({ onEdit, setDeleteTarget }: UseOrderTableColumnsProps) {
  const navigate = useNavigate();

  const columns: TableColumn<PORow>[] = [
    {
      header: "No. PO",
      key: "order_code",
      width: pixel(180),
      renderCell: (row: PORow) => <EntityCode id={row.order_code} />,
    },
    {
      header: "Tanggal",
      key: "order_date",
      width: pixel(120),
      renderCell: (row: PORow) => <Timestamp value={row.order_date} format="system_date" size="base" />,
    },
    {
      header: "Item",
      key: "item_names",
      width: proportional(1, { minWidth: 260 }),
      renderCell: (row: PORow) => {
        const items = row.item_names || [];
        const topItems = items.slice(0, 3);
        const remaining = items.length - 3;
        if (topItems.length === 0) return "-";
        return (
          <HStack gap={1} wrap="wrap">
            {topItems.map((item, idx) => (
              <Token key={idx} label={item} />
            ))}
            {remaining > 0 ? <Token label={`+${remaining}`} /> : null}
          </HStack>
        );
      },
    },
    {
      header: "Vendor",
      key: "vendor_names",
      width: proportional(1, { minWidth: 220 }),
      renderCell: (row: PORow) => {
        const vendors = row.vendor_names || [];
        const topVendors = vendors.slice(0, 3);
        const remaining = vendors.length - 3;
        if (topVendors.length === 0) return "-";
        return (
          <HStack gap={1} wrap="wrap">
            {topVendors.map((v, idx) => (
              <Token key={idx} label={v} />
            ))}
            {remaining > 0 ? <Token label={`+${remaining}`} /> : null}
          </HStack>
        );
      },
    },
    {
      align: "end",
      header: "Total (Rp)",
      key: "total_price",
      width: pixel(180),
      renderCell: (row: PORow) => <Text type="code">{formatNumber(row.total_price, 2)}</Text>,
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(140),
      renderCell: (row: PORow) => (
        <HStack gap={2} justify="end">
          <IconButton
            size="sm"
            variant="secondary"
            label="Detail"
            icon={<Eye />}
            onClick={() => navigate({ to: `/order/${row.order_id}` })}
          />
          <IconButton
            size="sm"
            variant="secondary"
            label="Edit"
            icon={<Pencil />}
            onClick={() => onEdit(row.order_id)}
          />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 />}
            onClick={() => setDeleteTarget({ id: row.order_id, label: row.order_code })}
          />
        </HStack>
      ),
    },
  ];

  return columns;
}
