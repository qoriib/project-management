import { Pencil, Trash2, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { HStack, Table, Text, IconButton, Button } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn, type TablePlugin } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import { usePOItemForm } from "./form/usePOItemForm";
import { ItemSelectorCell, QtyInputCell, PriceSelectorCell, VendorSelectorCell, EditActionsCell } from "./form/POItemCells";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import type { POItemDetail } from "@/db/repositories";
import type { BOMReportItem } from "@/db/services";

export interface POItemFormTableProps {
  items: POItemDetail[];
  onChange: (items: POItemDetail[]) => void;
  bomData: BOMReportItem[];
}

type POItemRow = {
  [K in keyof POItemDetail]: POItemDetail[K];
} & {
  isFooter?: boolean;
  isDraft?: boolean;
  [key: string]: unknown;
};

export function POItemFormTable({ items, onChange, bomData }: POItemFormTableProps) {
  const vendors = useMasterStore(s => s.vendors);
  const masterItems = useMasterStore(s => s.items);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<POItemDetail | undefined>(undefined);

  async function handleDelete() {
    if (!deleteTarget) return;
    const newItems = items.filter(i => i.po_item_id !== deleteTarget);
    onChange(newItems);
    setDeleteTarget(null);
  }

  const { form, handleItemChange } = usePOItemForm({
    initialData: editingData,
    onSubmitItem: (payload) => {
      const { items: masterItems, itemPricesMap, vendors } = useMasterStore.getState();
      const itemDef = masterItems.find(i => i.item_id === payload.item_id);
      const prices = itemPricesMap.get(payload.item_id) || [];
      const priceDef = prices.find(p => p.item_price_id === payload.item_price_id);
      const vendorDef = vendors.find(v => v.vendor_id === payload.vendor_id);
      
      const newDetail: POItemDetail = {
        po_item_id: editingData ? editingData.po_item_id : `draft-${Date.now()}`,
        po_id: "",
        item_id: payload.item_id,
        vendor_id: payload.vendor_id,
        item_price_id: payload.item_price_id,
        qty: payload.qty,
        price: priceDef?.price || 0,
        item_name: itemDef?.item_name || "",
        category_prefix: itemDef?.category_prefix || "",
        category_code: itemDef?.category_code || "",
        item_code: itemDef?.item_code || "",
        unit: itemDef?.unit_name || "",
        vendor_name: vendorDef?.vendor_name || "",
        total_delivered: 0,
        remaining: payload.qty
      };

      if (editingData) {
        onChange(items.map(i => i.po_item_id === editingData.po_item_id ? newDetail : i));
      } else {
        onChange([...items, newDetail]);
      }
    },
    onSuccess: () => {
      setEditingId(null);
      setEditingData(undefined);
    },
  });

  const columns: TableColumn<POItemRow>[] = [
    {
      key: "item_code_full",
      header: "Kode Item",
      width: pixel(160),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return null;
        if (row.po_item_id === editingId) {
          const { items: masterItems } = useMasterStore.getState();
          return (
            <form.Subscribe selector={(state) => state.values.item_id}>
              {(selectedItemId) => {
                const item = masterItems.find(i => i.item_id === selectedItemId);
                if (!item) return "-";
                const code = `${item.category_prefix || ""} ${item.category_code || ""} ${item.item_code || ""}`.trim();
                return code ? <EntityCode prefix="" id={code} /> : "-";
              }}
            </form.Subscribe>
          );
        }
        const code = `${row.category_prefix || ""} ${row.category_code || ""} ${row.item_code || ""}`.trim();
        return code ? <EntityCode prefix="" id={code} /> : "-";
      }
    },
    {
      key: "item",
      header: "Item",
      width: proportional(1),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return null;
        if (row.po_item_id === editingId) {
          const selectedItemIds = new Set(items.map(i => i.item_id).filter(Boolean) as string[]);
          return (
            <ItemSelectorCell
              form={form}
              bomOptions={bomData}
              selectedItemIds={selectedItemIds}
              onChangeItem={handleItemChange}
              editingId={editingId}
            />
          );
        }
        return <Text weight="medium">{row.item_name}</Text>;
      }
    },
    {
      key: "price_info",
      header: "Harga & Variasi (Rp)",
      width: pixel(200),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return null;
        if (row.po_item_id === editingId) {
          return (
            <form.Subscribe selector={(state) => state.values.item_id}>
              {(currentItemId) => {
                const itemPricesMap = useMasterStore(s => s.itemPricesMap);
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
        return <Text weight="medium">{formatNumber(row.price)}</Text>;
      }
    },
    {
      key: "vendor",
      header: "Vendor Pemasok",
      width: pixel(200),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return null;
        if (row.po_item_id === editingId) {
          return <VendorSelectorCell form={form} vendors={vendors} onAddNewVendor={() => setIsVendorFormOpen(true)} />;
        }
        return row.vendor_name || "—";
      }
    },
    {
      key: "unit",
      header: "Satuan",
      width: pixel(100),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return null;
        if (row.po_item_id === editingId) {
          const { items: masterItems } = useMasterStore.getState();
          return (
            <form.Subscribe selector={(state) => state.values.item_id}>
              {(selectedItemId) => {
                const item = masterItems.find(i => i.item_id === selectedItemId);
                return item ? <Text>{item.unit_name || "-"}</Text> : "-";
              }}
            </form.Subscribe>
          );
        }
        return row.unit || "-";
      }
    },
    {
      key: "qty_info",
      header: "Volume",
      width: pixel(140),
      align: "end",
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return null;
        if (row.po_item_id === editingId) {
          const currentItemId = form.getFieldValue("item_id");
          const currentPriceId = form.getFieldValue("item_price_id");
          const bomItem = bomData.find(b => b.item_id === currentItemId && b.item_price_id === currentPriceId);
          
          let totalOrdered = bomItem?.total_ordered || 0;
          let plannedVolume = bomItem?.planned_volume || 0;
          
          if (editingData) {
            // Subtract current qty if editing to get true remaining balance
            totalOrdered -= (editingData.qty || 0);
          }
          const initialBalance = plannedVolume - totalOrdered;
          
          return (
            <QtyInputCell form={form} initialBalance={initialBalance} />
          );
        }
        return <Text weight="medium">{formatNumber(row.qty, 2)}</Text>;
      }
    },
    {
      key: "subtotal",
      header: "Subtotal (Rp)",
      width: pixel(180),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return null;
        if (row.po_item_id === editingId) {
          return null; // or calculate preview
        }
        return formatNumber((row.qty || 0) * (row.price || 0));
      }
    },
    {
      key: "actions",
      header: "Aksi",
      align: "end",
      width: pixel(100),
      renderCell: (row: POItemRow) => {
        if (row.isFooter) return null;

        if (row.po_item_id === editingId) {
          return (
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <EditActionsCell 
                  isSubmitting={isSubmitting}
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

  const dataWithFooters = useMemo(() => {
    const list = [...items] as POItemRow[];
    if (editingId === "new-item") {
      list.push({ po_item_id: "new-item", isDraft: true } as unknown as POItemRow);
    }
    list.push({ isFooter: true, po_item_id: "footer" } as unknown as POItemRow);
    return list;
  }, [items, editingId]);

  const footerPlugin = useMemo((): TablePlugin<POItemRow> => ({
    transformBodyRow(props, item) {
      if ((item as any).isFooter) {
        const hideButton = !!editingId;
        return {
          ...props,
          children: (
            <td colSpan={999} style={{ padding: "8px 16px", background: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border)" }}>
              {!hideButton && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={16} />}
                  label="Tambah Kebutuhan"
                  onClick={() => {
                    setEditingData(undefined);
                    setEditingId("new-item");
                  }}
                />
              )}
            </td>
          )
        };
      }
      if (item.po_item_id === editingId) {
        return {
          ...props,
          xstyle: [...props.xstyle, { background: "var(--color-bg-muted)" }]
        };
      }
      return props;
    }
  }), [editingId]);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Table
          hasHover
          textOverflow="truncate"
          columns={columns}
          data={dataWithFooters}
          idKey="po_item_id"
          plugins={{ footer: footerPlugin }}
          emptyState={<TableEmptyState message="Belum ada item. Klik 'Tambah Kebutuhan'." />}
        />
      </form>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Item PO"
        message="Apakah Anda yakin ingin menghapus item ini dari Purchase Order?"
      />
      <MasterVendorForm
        isOpen={isVendorFormOpen}
        onClose={() => setIsVendorFormOpen(false)}
        initialData={null}
      />
      <MasterItemPriceDialog
        isOpen={isPriceFormOpen}
        onClose={() => setIsPriceFormOpen(false)}
        item={masterItems.find((i) => i.item_id === form.getFieldValue("item_id")) || null}
      />
    </>
  );
}
