import { useNavigate } from "@tanstack/react-router";
import { Table, proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Timestamp } from "@astryxdesign/core";
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
      header: "No. DLV",
      width: pixel(100),
      renderCell: (row) => <EntityCode prefix="DLV" id={row.delivery_id} />
    },
    {
      key: "delivery_date",
      header: "Tanggal Kirim",
      width: pixel(120),
      renderCell: (row) => <Timestamp value={row.delivery_date} format="system_date" />
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
      width: pixel(180),
      renderCell: (row) => `${formatNumber(row.qty, 2)} ${row.unit ?? ""}`
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
