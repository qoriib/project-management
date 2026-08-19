import { useNavigate } from "@tanstack/react-router";
import { Table, type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text, Timestamp } from "@astryxdesign/core";
import { Pencil } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import type { DeliveryItemByPO } from "@/db/repositories";
import { usePOStore } from "@/store/usePOStore";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";

type LogRow = DeliveryItemByPO & Record<string, unknown>;

export function PODeliveryLogTable() {
  const navigate = useNavigate(),
    { currentDeliveryItems: deliveryItems } = usePOStore(),
    deliveryColumns: TableColumn<LogRow>[] = [
      {
        header: "No. NP",
        key: "delivery_id",
        renderCell: (row) => <EntityCode id={row.delivery_code || row.delivery_id} />,
        width: pixel(180),
      },
      {
        header: "Tanggal Kirim",
        key: "delivery_date",
        renderCell: (row) => (
          <Timestamp value={row.delivery_date} format="system_date" size="base" />
        ),
        width: pixel(120),
      },
      {
        header: "Item",
        key: "item_name",
        renderCell: (row) => row.item_name,
        width: proportional(1),
      },
      {
        align: "end",
        header: "Volume Diterima",
        key: "qty",
        renderCell: (row) => (
          <Text type="code">
            {formatNumber(row.qty, 2)} {row.unit ?? ""}
          </Text>
        ),
        width: pixel(180),
      },
      {
        align: "end",
        header: "Aksi",
        key: "actions",
        renderCell: (row) => (
          <IconButton
            size="sm"
            variant="secondary"
            label="Edit"
            icon={<Pencil size={16} />}
            onClick={() => navigate({ to: `/delivery/${row.delivery_id}/edit` })}
          />
        ),
        width: pixel(60),
      },
    ];

  return (
    <Table
      hasHover
      textOverflow="truncate"
      columns={deliveryColumns}
      data={deliveryItems as LogRow[]}
      idKey="delivery_item_id"
      emptyState={
        <TableEmptyState message="Belum ada realisasi pengiriman material untuk PO ini." />
      }
    />
  );
}
