import { Pencil, Trash2 } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import {
  EditActionsCell,
  ItemSelectorCell,
  PriceSelectorCell,
  QtyInputCell,
  VendorSelectorCell,
} from "@/components/po/table/POItemCells";
import type { POItemDetail } from "@/db/repositories";
import type { BOMReportItem } from "@/db/services";
import type { usePOItemForm } from "@/components/po/form/usePOItemForm";

export interface POItemRow extends POItemDetail, Record<string, unknown> {
  isFooter?: boolean;
  isDraft?: boolean;
}

interface UsePOItemFormColumnsProps {
  editingId: string | null;
  form: ReturnType<typeof usePOItemForm>["form"];
  items: POItemDetail[];
  bomData: BOMReportItem[];
  handleItemChange: (itemId: string) => void | Promise<void>;
  setEditingId: (id: string | null) => void;
  setEditingData: (data: POItemDetail | undefined) => void;
  setDeleteTarget: (id: string | null) => void;
  setIsVendorFormOpen: (open: boolean) => void;
  setIsPriceFormOpen: (open: boolean) => void;
}

export function usePOItemFormColumns({
  editingId,
  form,
  items,
  bomData,
  handleItemChange,
  setEditingId,
  setEditingData,
  setDeleteTarget,
  setIsVendorFormOpen,
  setIsPriceFormOpen,
}: UsePOItemFormColumnsProps) {
  const vendors = useMasterStore((s) => s.vendors),
    columns: TableColumn<POItemRow>[] = [
      {
        header: "Kode Item",
        key: "item_code_full",
        renderCell: (row: POItemRow) => {
          if (row.isFooter) return null;
          if (row.po_item_id === editingId) {
            const { items: masterItems } = useMasterStore.getState();
            return (
              <form.Subscribe selector={(state) => state.values.item_id}>
                {(selectedItemId) => {
                  const item = masterItems.find((i) => i.item_id === selectedItemId);
                  if (!item) return "-";
                  const code =
                    `${item.category_prefix || ""} ${item.category_code || ""} ${item.item_code || ""}`.trim();
                  return code ? <EntityCode prefix="" id={code} /> : "-";
                }}
              </form.Subscribe>
            );
          }
          const code =
            `${row.category_prefix || ""} ${row.category_code || ""} ${row.item_code || ""}`.trim();
          return code ? <EntityCode prefix="" id={code} /> : "-";
        },
        width: pixel(160),
      },
      {
        header: "Item",
        key: "item",
        renderCell: (row: POItemRow) => {
          if (row.isFooter) return null;
          if (row.po_item_id === editingId) {
            const selectedItemIds = new Set(
              items.map((i) => i.item_id).filter(Boolean) as string[],
            );
            return (
              <ItemSelectorCell
                form={form}
                bomOptions={bomData}
                selectedItemIds={selectedItemIds}
                onChangeItem={handleItemChange as (itemId: string) => Promise<void>}
                editingId={editingId}
              />
            );
          }
          return <Text weight="medium">{row.item_name}</Text>;
        },
        width: proportional(1),
      },
      {
        align: "end",
        header: "Harga & Variasi (Rp)",
        key: "price_info",
        renderCell: (row: POItemRow) => {
          if (row.isFooter) return null;
          if (row.po_item_id === editingId) {
            return (
              <form.Subscribe selector={(state) => state.values.item_id}>
                {(currentItemId) => {
                  const itemPricesMap = useMasterStore((s) => s.itemPricesMap);
                  const prices = itemPricesMap.get(currentItemId) || [];
                  return (
                    <PriceSelectorCell
                      form={form}
                      itemId={currentItemId}
                      prices={prices}
                      onAddNewPrice={() => setIsPriceFormOpen(true)}
                    />
                  );
                }}
              </form.Subscribe>
            );
          }
          return (
            <Text type="code" weight="medium">
              {formatNumber(row.price)}
            </Text>
          );
        },
        width: pixel(240),
      },
      {
        header: "Vendor Pemasok",
        key: "vendor",
        renderCell: (row: POItemRow) => {
          if (row.isFooter) return null;
          if (row.po_item_id === editingId) {
            return (
              <VendorSelectorCell
                form={form}
                vendors={vendors}
                onAddNewVendor={() => setIsVendorFormOpen(true)}
              />
            );
          }
          return row.vendor_name || "—";
        },
        width: pixel(280),
      },
      {
        header: "Satuan",
        key: "unit",
        renderCell: (row: POItemRow) => {
          if (row.isFooter) return null;
          if (row.po_item_id === editingId) {
            const { items: masterItems } = useMasterStore.getState();
            return (
              <form.Subscribe selector={(state) => state.values.item_id}>
                {(selectedItemId) => {
                  const item = masterItems.find((i) => i.item_id === selectedItemId);
                  return item ? <Text>{item.unit_name || "-"}</Text> : "-";
                }}
              </form.Subscribe>
            );
          }
          return row.unit || "-";
        },
        width: pixel(80),
      },
      {
        align: "end",
        header: "Volume",
        key: "qty_info",
        renderCell: (row: POItemRow) => {
          if (row.isFooter) return null;
          if (row.po_item_id === editingId) {
            return <QtyInputCell form={form} />;
          }
          return (
            <Text type="code" weight="medium">
              {formatNumber(row.qty, 2)}
            </Text>
          );
        },
        width: pixel(140),
      },
      {
        align: "end",
        header: "Subtotal (Rp)",
        key: "subtotal",
        renderCell: (row: POItemRow) => {
          if (row.isFooter) return null;
          if (row.po_item_id === editingId) {
            return null; // or calculate preview
          }
          return <Text type="code">{formatNumber((row.qty || 0) * (row.price || 0))}</Text>;
        },
        width: pixel(180),
      },
      {
        align: "end",
        header: "Aksi",
        key: "actions",
        renderCell: (row: POItemRow) => {
          if (row.isFooter) return null;

          if (row.po_item_id === editingId) {
            return (
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <EditActionsCell
                    isSubmitting={isSubmitting}
                    onSave={() => {
                      form.handleSubmit();
                    }}
                    onCancel={() => {
                      setEditingId(null);
                      setEditingData(undefined);
                      form.reset();
                    }}
                  />
                )}
              </form.Subscribe>
            );
          }

          return (
            <HStack gap={2} justify="end">
              <IconButton
                size="sm"
                variant="secondary"
                label="Edit"
                icon={<Pencil size={16} />}
                isDisabled={!!editingId}
                onClick={() => {
                  setEditingId(row.po_item_id);
                  setEditingData(row as POItemDetail);
                }}
              />
              <IconButton
                size="sm"
                variant="destructive"
                label="Hapus"
                icon={<Trash2 size={16} />}
                isDisabled={!!editingId}
                onClick={() => setDeleteTarget(row.po_item_id)}
              />
            </HStack>
          );
        },
        width: pixel(100),
      },
    ];

  return columns;
}
