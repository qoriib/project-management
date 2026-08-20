import { Pencil, Trash2 } from "lucide-react";
import { HStack, IconButton, Text, VStack } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import {
  EditActionsCell,
  ItemSelectorCell,
  PriceSelectorCell,
  QtyInputCell,
  VendorSelectorCell,
  SubtotalCell,
  ItemCodeDisplayCell,
  UnitDisplayCell,
} from "@/components/po/table/POItemCells";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
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
  const vendors = useMasterStore((s) => s.vendors);

  const columns: TableColumn<POItemRow>[] = [
    {
      header: "Item",
      key: "item",
      width: proportional(2),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return <div />;

        if (row.po_item_id === editingId) {
          const selectedItemIds = new Set(items.map((i) => i.item_id).filter(Boolean) as string[]);

          return (
            <VStack gap={1} align="start" width="100%">
              <ItemSelectorCell
                form={form}
                bomOptions={bomData}
                selectedItemIds={selectedItemIds}
                onChangeItem={handleItemChange as (itemId: string) => Promise<void>}
                editingId={editingId}
              />
              <ItemCodeDisplayCell form={form} />
            </VStack>
          );
        }

        const code = formatItemCode(row);
        return (
          <VStack gap={1} align="start">
            <Text weight="medium">{row.item_name}</Text>
            {code ? (
              <EntityCode id={code} />
            ) : (
              <Text size="sm" color="secondary">
                -
              </Text>
            )}
          </VStack>
        );
      },
    },

    {
      align: "end",
      header: "Harga & Variasi (Rp)",
      key: "price_info",
      width: pixel(240),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return <div />;

        if (row.po_item_id === editingId) {
          return <PriceSelectorCell form={form} onAddNewPrice={() => setIsPriceFormOpen(true)} />;
        }

        const bomItem = bomData.find((b) => b.item_id === row.item_id && b.item_price_id === row.item_price_id);
        const bomPrice = bomItem?.price ?? 0;

        return (
          <VStack gap={0.5} align="end">
            <HStack gap={1} justify="end">
              <Text weight="medium">Realisasi:</Text>
              <Text type="code">{formatNumber(row.price)}</Text>
            </HStack>
            <HStack gap={1} justify="end">
              <Text size="sm" color="secondary">
                Rencana:
              </Text>
              <Text type="code" size="sm" color="secondary">
                {formatNumber(bomPrice)}
              </Text>
            </HStack>
          </VStack>
        );
      },
    },
    {
      header: "Vendor",
      key: "vendor",
      width: pixel(280),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return <div />;

        if (row.po_item_id === editingId) {
          return <VendorSelectorCell form={form} vendors={vendors} onAddNewVendor={() => setIsVendorFormOpen(true)} />;
        }

        return row.vendor_name ?? "—";
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return <div />;

        if (row.po_item_id === editingId) {
          return <UnitDisplayCell form={form} />;
        }

        return row.unit ?? "-";
      },
    },
    {
      align: "end",
      header: "Volume",
      key: "qty_info",
      width: pixel(140),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return <div />;

        if (row.po_item_id === editingId) {
          return <QtyInputCell form={form} />;
        }

        return (
          <Text type="code" weight="medium">
            {formatNumber(row.qty, 2)}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return <div />;

        if (row.po_item_id === editingId) {
          return <SubtotalCell form={form} />;
        }

        return <Text type="code">{formatNumber((row.qty ?? 0) * (row.price ?? 0))}</Text>;
      },
      width: pixel(180),
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: proportional(1),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return <div />;

        if (row.po_item_id === editingId) {
          return (
            <form.Subscribe
              selector={(s) => ({
                isSubmitting: s.isSubmitting,
                canSubmit: s.canSubmit,
              })}
            >
              {({ isSubmitting, canSubmit }) => (
                <EditActionsCell
                  isSubmitting={isSubmitting}
                  canSubmit={canSubmit}
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
    },
  ];

  return columns;
}
