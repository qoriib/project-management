import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Table } from "@astryxdesign/core";
import { type TablePlugin } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useMasterStore } from "@/store/useMasterStore";
import { usePOItemForm } from "./form/usePOItemForm";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import type { POItemDetail } from "@/db/repositories";
import type { BOMReportItem } from "@/db/services";
import { type POItemRow, usePOItemFormColumns } from "./table/usePOItemFormColumns";

export interface POItemFormTableProps {
  items: POItemDetail[];
  onChange: (items: POItemDetail[]) => void;
  bomData: BOMReportItem[];
}

export function POItemFormTable({ items, onChange, bomData }: POItemFormTableProps) {
  const masterItems = useMasterStore((s) => s.items),
    [deleteTarget, setDeleteTarget] = useState<string | null>(null),
    [isVendorFormOpen, setIsVendorFormOpen] = useState(false),
    [isPriceFormOpen, setIsPriceFormOpen] = useState(false),
    // Form State
    [editingId, setEditingId] = useState<string | null>(null),
    [editingData, setEditingData] = useState<POItemDetail | undefined>();

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    const newItems = items.filter((i) => i.po_item_id !== deleteTarget);
    onChange(newItems);
    setDeleteTarget(null);
  }

  const { form, handleItemChange } = usePOItemForm({
      initialData: editingData,
      onSubmitItem: (payload) => {
        const { items: masterItems, itemPricesMap, vendors } = useMasterStore.getState(),
          itemDef = masterItems.find((i) => i.item_id === payload.item_id),
          prices = itemPricesMap.get(payload.item_id) || [],
          priceDef = prices.find((p) => p.item_price_id === payload.item_price_id),
          vendorDef = vendors.find((v) => v.vendor_id === payload.vendor_id),
          newDetail: POItemDetail = {
            category_code: itemDef?.category_code || "",
            category_prefix: itemDef?.category_prefix || "",
            item_code: itemDef?.item_code || "",
            item_id: payload.item_id,
            item_name: itemDef?.item_name || "",
            item_price_id: payload.item_price_id,
            po_id: "",
            po_item_id: editingData ? editingData.po_item_id : `draft-${Date.now()}`,
            price: priceDef?.price || 0,
            qty: payload.qty,
            remaining: payload.qty,
            total_delivered: 0,
            unit: itemDef?.unit_name || "",
            vendor_id: payload.vendor_id,
            vendor_name: vendorDef?.vendor_name || "",
          };

        if (editingData) {
          onChange(items.map((i) => (i.po_item_id === editingData.po_item_id ? newDetail : i)));
        } else {
          onChange([...items, newDetail]);
        }
      },
      onSuccess: () => {
        setEditingId(null);
        setEditingData(undefined);
      },
    }),
    columns = usePOItemFormColumns({
      bomData,
      editingId,
      form,
      handleItemChange,
      items,
      setDeleteTarget,
      setEditingData,
      setEditingId,
      setIsPriceFormOpen,
      setIsVendorFormOpen,
    }),
    dataWithFooters = useMemo(() => {
      const list = [...items] as POItemRow[];
      if (editingId === "new-item") {
        list.push({ isDraft: true, po_item_id: "new-item" } as unknown as POItemRow);
      }
      list.push({ isFooter: true, po_item_id: "footer" } as unknown as POItemRow);
      return list;
    }, [items, editingId]),
    footerPlugin = useMemo(
      (): TablePlugin<POItemRow> => ({
        transformBodyRow(props: any, item: POItemRow) {
          if ((item as any).isFooter) {
            const hideButton = Boolean(editingId);
            return {
              ...props,
              children: (
                <td
                  colSpan={999}
                  style={{
                    background: "var(--color-bg-base)",
                    borderBottom: "1px solid var(--color-border)",
                    padding: "8px 16px",
                  }}
                >
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
              ),
            };
          }
          if (item.po_item_id === editingId) {
            return {
              ...props,
              xstyle: [...props.xstyle, { background: "var(--color-bg-muted)" }],
            };
          }
          return props;
        },
      }),
      [editingId],
    );

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
        isOpen={Boolean(deleteTarget)}
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
