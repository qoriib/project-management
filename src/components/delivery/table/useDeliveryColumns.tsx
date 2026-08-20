import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { HStack, IconButton, Text, Timestamp, Token } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import {
  type TableColumn,
  pixel,
  proportional,
} from "@astryxdesign/core/Table";
import { type DeliverySummary } from "@/db/repositories";

export interface DeliveryRow extends DeliverySummary, Record<string, unknown> {}

interface UseDeliveryColumnsProps {
  setDeleteTarget: (id: string | null) => void;
}

export function useDeliveryColumns({
  setDeleteTarget,
}: UseDeliveryColumnsProps) {
  const navigate = useNavigate();

  const columns: TableColumn<DeliveryRow>[] = [
    {
      header: "No. Penerimaan",
      key: "delivery_id",
      width: pixel(180),
      renderCell: (row) => <EntityCode id={row.delivery_code} />,
    },
    {
      header: "Tanggal",
      key: "delivery_date",
      width: pixel(120),
      renderCell: (row) => (
        <Timestamp value={row.delivery_date} format="system_date" size="base" />
      ),
    },
    {
      header: "Ref. PO",
      key: "po_id",
      width: pixel(180),
      renderCell: (row) => <EntityCode id={row.po_code || row.po_id} />,
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
                to: "/delivery/$id/edit",
                params: { id: String(row.delivery_id) },
              })
            }
          />
          <IconButton
            size="sm"
            variant="destructive"
            label="Hapus"
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteTarget(row.delivery_id)}
          />
        </HStack>
      ),
    },
  ];

  return columns;
}
