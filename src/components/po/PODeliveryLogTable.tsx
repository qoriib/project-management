import { useNavigate } from "@tanstack/react-router";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text, Timestamp } from "@astryxdesign/core";
import { Pencil } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { usePOStore } from "@/store/usePOStore";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { Table, type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { DeliveryItemByPO } from "@/db/repositories";

type LogRow = DeliveryItemByPO & Record<string, unknown>;

export function PODeliveryLogTable() {
  const navigate = useNavigate();
  const { currentDeliveryItems: deliveryItems } = usePOStore();

  const deliveryColumns: TableColumn<LogRow>[] = [
    {
      header: "No. NP",
      key: "delivery_id",
      width: pixel(160),
      renderCell: (row) => <EntityCode id={row.delivery_code ?? row.delivery_id} />,
    },
    {
      header: "Tanggal Kirim",
      key: "delivery_date",
      width: pixel(120),
      renderCell: (row) => <Timestamp value={row.delivery_date} format="system_date" size="base" />,
    },
    {
      header: "Item",
      key: "item_name",
      renderCell: (row) => row.item_name,
      width: proportional(4),
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
    },
    {
      align: "end",
      header: "Volume Diterima",
      key: "qty",
      width: pixel(140),
      renderCell: (row) => <Text type="code">{formatNumber(row.qty, 2)}</Text>,
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: proportional(1),
      renderCell: (row) => (
        <IconButton
          size="sm"
          variant="secondary"
          label="Edit"
          icon={<Pencil size={16} />}
          onClick={() => navigate({ to: `/delivery/${row.delivery_id}/edit` })}
        />
      ),
    },
  ];

  return (
    <Table
      hasHover
      idKey="delivery_item_id"
      textOverflow="truncate"
      columns={deliveryColumns}
      data={deliveryItems as LogRow[]}
      emptyState={
        <TableEmptyState message="Belum ada realisasi Penerimaan material untuk PO ini." />
      }
    />
  );
}
