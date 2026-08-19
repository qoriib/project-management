import { Check, Pencil, Trash2, X } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber } from "@/utils/formatters";
import {
  ItemCodeDisplayCell,
  ItemSelectorCell,
  PriceSelectorCell,
  QtyInputCell,
  TotalEstimasiCell,
  UnitDisplayCell,
} from "@/components/bom/table/BOMItemCells";
import type { BOMDetail } from "@/db/repositories";
import { useBOMForm } from "@/components/bom/form/useBOMForm";

export interface BomRow extends BOMDetail, Record<string, unknown> {
  isFooter?: boolean;
  isDraft?: boolean;
}

interface UseBOMColumnsProps {
  editingId: string | null;
  form: ReturnType<typeof useBOMForm>["form"];
  items: any[];
  handleItemChange: (itemId: string) => void;
  setIsItemFormOpen: (open: boolean) => void;
  setIsPriceFormOpen: (open: boolean) => void;
  setEditingId: (id: string | null) => void;
  setEditingData: (data: BOMDetail | undefined) => void;
  setEditingGroupId: (id: string | undefined) => void;
  setDeleteTarget: (id: string | null) => void;
  isApproved: boolean;
}

export function useBOMColumns({
  editingId,
  form,
  items,
  handleItemChange,
  setIsItemFormOpen,
  setIsPriceFormOpen,
  setEditingId,
  setEditingData,
  setEditingGroupId,
  setDeleteTarget,
  isApproved,
}: UseBOMColumnsProps) {
  const baseColumns: TableColumn<BomRow>[] = [
    {
      header: "Kode Item",
      key: "item_code_full",
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return <ItemCodeDisplayCell form={form} items={items} />;
        }
        const code =
          `${row.category_prefix || ""} ${row.category_code || ""} ${row.item_code || ""}`.trim();
        return code ? <EntityCode prefix="" id={code} /> : "-";
      },
      width: pixel(160),
    },
    {
      header: "Nama Item",
      key: "item_name",
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return (
            <ItemSelectorCell
              form={form}
              items={items}
              handleItemChange={handleItemChange}
              onAddNewItem={() => setIsItemFormOpen(true)}
            />
          );
        }
        return row.item_name;
      },
      width: proportional(1),
    },
    {
      header: "Satuan",
      key: "unit",
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return <UnitDisplayCell form={form} items={items} />;
        }
        return row.unit || "-";
      },
      width: pixel(80),
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      renderCell: (row: BomRow) => {
        if (row.isFooter) {
          return (
            <Text type="code" weight="bold">
              {formatNumber(row.price)}
            </Text>
          );
        }
        const subtotal = (row.qty || 0) * (row.price || 0);
        return (
          <Text type="code" weight="medium">
            {formatNumber(subtotal)}
          </Text>
        );
      },
      width: pixel(220),
    },
    {
      align: "end",
      header: "Volume Rencana",
      key: "qty",
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return <QtyInputCell form={form} />;
        }
        return <Text type="code">{formatNumber(row.qty, 6)}</Text>;
      },
      width: pixel(140),
    },
    {
      align: "end",
      header: "Harga Rencana (Rp)",
      key: "price",
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return (
            <PriceSelectorCell
              form={form}
              editingId={editingId}
              onAddNewPrice={() => setIsPriceFormOpen(true)}
            />
          );
        }
        return <Text type="code">{formatNumber(row.price)}</Text>;
      },
      width: pixel(220),
    },
    {
      align: "end",
      header: "Total Estimasi (Rp)",
      key: "estimation",
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return <TotalEstimasiCell form={form} />;
        }
        return <Text type="code">{formatNumber(row.estimated_total || 0)}</Text>;
      },
      width: pixel(260),
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;

        if (row.bom_id === editingId) {
          return (
            <HStack gap={2} justify="end">
              <form.Subscribe selector={(s) => s.canSubmit}>
                {(canSubmit) => (
                  <IconButton
                    size="sm"
                    variant="primary"
                    label="Simpan"
                    icon={<Check size={16} />}
                    isDisabled={!canSubmit}
                    onClick={() => {
                      form.handleSubmit();
                    }}
                  />
                )}
              </form.Subscribe>
              <IconButton
                size="sm"
                variant="secondary"
                label="Batal"
                icon={<X size={16} />}
                onClick={() => {
                  setEditingId(null);
                  setEditingData(undefined);
                  setEditingGroupId(undefined);
                  form.reset();
                }}
              />
            </HStack>
          );
        }

        return (
          <HStack gap={2} justify="end">
            {!isApproved && (
              <>
                <IconButton
                  size="sm"
                  variant="secondary"
                  label="Edit"
                  icon={<Pencil size={16} />}
                  isDisabled={!!editingId}
                  onClick={() => {
                    setEditingId(row.bom_id);
                    setEditingData(row as BOMDetail);
                    setEditingGroupId(row.bom_group_id);
                  }}
                />
                <IconButton
                  size="sm"
                  variant="destructive"
                  label="Hapus"
                  icon={<Trash2 size={16} />}
                  isDisabled={!!editingId}
                  onClick={() => setDeleteTarget(row.bom_id)}
                />
              </>
            )}
          </HStack>
        );
      },
      width: pixel(100),
    },
  ];

  return isApproved ? baseColumns.slice(0, -1) : baseColumns;
}
