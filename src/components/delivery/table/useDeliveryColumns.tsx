import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Badge, HStack, IconButton, Text, Timestamp } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { type DeliverySummary } from "@/db/repositories";
import { EntityCode } from "@/components/shared/EntityCode";

export interface DeliveryRow extends DeliverySummary, Record<string, unknown> {}

interface UseDeliveryColumnsProps {
  setDeleteTarget: (id: string | null) => void;
}

export function useDeliveryColumns({ setDeleteTarget }: UseDeliveryColumnsProps) {
  const navigate = useNavigate(),
    columns: TableColumn<DeliveryRow>[] = [
      {
        header: "No. Pengiriman",
        key: "delivery_id",
        renderCell: (row) => <EntityCode id={row.delivery_code} />,
        width: pixel(140),
      },
      {
        header: "Tanggal",
        key: "delivery_date",
        renderCell: (row) => (
          <Timestamp value={row.delivery_date} format="system_date" size="base" />
        ),
        width: pixel(120),
      },
      {
        header: "Ref. PO",
        key: "po_id",
        renderCell: (row) => <EntityCode id={row.po_code || row.po_id} />,
        width: pixel(180),
      },
      {
        header: "Vendor Pemasok",
        key: "vendor_names",
        renderCell: (row) => (
          <HStack gap={1} style={{ flexWrap: "wrap" }}>
            {row.vendor_names
              ? row.vendor_names
                  .split(",")
                  .map((v: string, i: number) => (
                    <Badge key={i} variant="neutral" label={v.trim()} />
                  ))
              : "—"}
          </HStack>
        ),
        width: proportional(1.5),
      },
      {
        align: "end",
        header: "Total Item",
        key: "item_count",
        renderCell: (row) => <Text type="code">{row.item_count} Item</Text>,
        width: pixel(120),
      },
      {
        align: "end",
        header: "Aksi",
        key: "actions",
        renderCell: (row) => (
          <HStack justify="end" gap={2}>
            <IconButton
              size="sm"
              variant="secondary"
              icon={<Pencil size={16} />}
              label="Edit"
              onClick={() =>
                navigate({ to: "/delivery/$id/edit", params: { id: String(row.delivery_id) } })
              }
            />
            <IconButton
              size="sm"
              variant="destructive"
              icon={<Trash2 size={16} />}
              label="Hapus"
              onClick={() => setDeleteTarget(row.delivery_id)}
            />
          </HStack>
        ),
        width: pixel(120),
      },
    ];

  return columns;
}
