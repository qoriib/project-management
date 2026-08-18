import { useNavigate } from "@tanstack/react-router";
import { Table, proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Timestamp, Text } from "@astryxdesign/core";
import { Pencil } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import type { DeliveryItemByPO } from "@/db/repositories";
import { usePOStore } from "@/store/usePOStore";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";

export function PODeliveryLogTable() {
  const navigate = useNavigate();

  const { currentDeliveryItems: deliveryItems } = usePOStore();


  const deliveryColumns: TableColumn<DeliveryItemByPO>[] = [
    {
      key: "delivery_id",
      header: "No. NP",
      width: pixel(180),
      renderCell: (row) => <Text weight="medium">{row.delivery_code || row.delivery_id}</Text>
    },
    {
      key: "delivery_date",
      header: "Tanggal Kirim",
      width: pixel(120),
      renderCell: (row) => <Timestamp value={row.delivery_date} format="system_date" size="base" />
    },
    {
      key: "item_name",
      header: "Item",
      width: proportional(1),
      renderCell: (row) => row.item_name
    },
    {
      key: "qty",
      header: "Volume Diterima",
      align: "end",
      width: pixel(180),
      renderCell: (row) => <Text type="code">{formatNumber(row.qty, 2)} {row.unit ?? ""}</Text>
    },
    {
      key: "actions",
      header: "Aksi",
      align: "end",
      width: pixel(60),
      renderCell: (row) => (
        <IconButton
          size="sm"
          variant="secondary"
          label="Edit"
          icon={<Pencil size={16} />}
          onClick={() => navigate({ to: `/delivery/${row.delivery_id}/edit` })}
        />
      )
    },
  ];

  return (
    <Table
      hasHover
      textOverflow="truncate"
      columns={deliveryColumns}
      data={deliveryItems}
      idKey="delivery_item_id"
      emptyState={<TableEmptyState message="Belum ada realisasi pengiriman material untuk PO ini." />}
    />
  );
}
