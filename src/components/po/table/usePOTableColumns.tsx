import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge, HStack, IconButton, Text, Timestamp } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { formatNumber } from "@/utils/formatters";
import { useNavigate } from "@tanstack/react-router";
import { type POWithSummary } from "@/db/repositories";
import { EntityCode } from "@/components/shared/EntityCode";

export interface PORow extends POWithSummary, Record<string, unknown> {
  po_code: string;
}

interface UsePOTableColumnsProps {
  onEdit: (id: string) => void;
  setDeleteTarget: (target: { id: string; label: string } | null) => void;
}

export function usePOTableColumns({ onEdit, setDeleteTarget }: UsePOTableColumnsProps) {
  const navigate = useNavigate(),
    columns: TableColumn<PORow>[] = [
      {
        header: "No. PO",
        key: "po_code",
        renderCell: (row: PORow) => <EntityCode id={row.po_code} />,
        width: pixel(180),
      },
      {
        header: "Tanggal",
        key: "po_date",
        renderCell: (row: PORow) => (
          <Timestamp value={row.po_date} format="system_date" size="base" />
        ),
        width: pixel(120),
      },
      {
        header: "Vendor Pemasok",
        key: "vendor_names",
        renderCell: (row: PORow) =>
          row.vendor_names ? (
            <HStack gap={1} style={{ flexWrap: "wrap" }}>
              {row.vendor_names.split(",").map((v, idx) => (
                <Badge key={idx} variant="neutral" label={v.trim()} />
              ))}
            </HStack>
          ) : (
            "—"
          ),
        width: proportional(1),
      },
      {
        align: "end",
        header: "Total Item",
        key: "item_count",
        renderCell: (row: PORow) => <Text type="code">{row.item_count} Item</Text>,
        width: pixel(140),
      },
      {
        align: "end",
        header: "Total Biaya (Rp)",
        key: "total_price",
        renderCell: (row: PORow) => <Text type="code">{formatNumber(row.total_price)}</Text>,
        width: pixel(200),
      },
      {
        align: "end",
        header: "Aksi",
        key: "actions",
        renderCell: (row: PORow) => (
          <HStack gap={2} justify="end">
            <IconButton
              size="sm"
              variant="secondary"
              label="Detail"
              icon={<Eye size={16} />}
              onClick={() => navigate({ to: `/po/${row.po_id}` })}
            />
            <IconButton
              size="sm"
              variant="secondary"
              label="Edit"
              icon={<Pencil size={16} />}
              onClick={() => onEdit(row.po_id)}
            />
            <IconButton
              size="sm"
              variant="destructive"
              label="Hapus"
              icon={<Trash2 size={16} />}
              onClick={() => setDeleteTarget({ id: row.po_id, label: row.po_code })}
            />
          </HStack>
        ),
        width: pixel(140),
      },
    ];

  return columns;
}
