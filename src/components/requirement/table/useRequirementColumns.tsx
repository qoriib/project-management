import { Check, Pencil, Trash2, X } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber, formatItemCode } from "@/utils/formatters";
import { useRequirementForm } from "@/components/requirement/form/useRequirementForm";
import {
  ItemCodeDisplayCell,
  ItemSelectorCell,
  PriceSelectorCell,
  QtyInputCell,
  SubtotalCell,
  UnitDisplayCell,
} from "@/components/requirement/table/RequirementItemCells";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { RequirementDetail, ItemWithDetails } from "@/db/repositories";

export interface RequirementRow extends RequirementDetail, Record<string, unknown> {
  isFooter?: boolean;
  isDraft?: boolean;
}

interface UseRequirementColumnsProps {
  editingId: string | null;
  form: ReturnType<typeof useRequirementForm>["form"];
  items: ItemWithDetails[];
  handleItemChange: (itemId: string) => void;
  setIsItemFormOpen: (open: boolean) => void;
  setIsPriceFormOpen: (open: boolean) => void;
  setEditingId: (id: string | null) => void;
  setDeletingId: (id: string | null) => void;
  isApproved: boolean;
}

export function useRequirementColumns({
  editingId,
  form,
  items,
  handleItemChange,
  setIsItemFormOpen,
  setIsPriceFormOpen,
  setEditingId,
  setDeletingId,
  isApproved,
}: UseRequirementColumnsProps) {
  const isEditing = (row: RequirementRow) => row.requirement_id === editingId || (editingId === "new" && row.isDraft);

  const baseColumns: TableColumn<RequirementRow>[] = [
    {
      header: "Kode Item",
      key: "item_code_full",
      width: pixel(160),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) return <ItemCodeDisplayCell form={form} items={items} />;

        const code = formatItemCode(row);
        return code ? <EntityCode id={code} /> : "-";
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(3),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) {
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
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) return <UnitDisplayCell form={form} items={items} />;

        return row.unit;
      },
    },
    {
      align: "end",
      header: "Volume Rencana",
      key: "qty",
      width: pixel(140),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) return <QtyInputCell form={form} />;

        return <Text type="code">{formatNumber(row.qty, 6)}</Text>;
      },
    },
    {
      align: "end",
      header: "Harga Rencana (Rp)",
      key: "price",
      width: pixel(220),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) {
          return (
            <PriceSelectorCell form={form} editingId={editingId ?? ""} onAddNewPrice={() => setIsPriceFormOpen(true)} />
          );
        }

        return <Text type="code">{formatNumber(row.price)}</Text>;
      },
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(260),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) return <SubtotalCell form={form} />;

        return <Text type="code">{formatNumber(row.estimated_total ?? 0)}</Text>;
      },
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: proportional(1),
      renderCell: (row) => {
        if (row.isFooter) return null;

        if (isEditing(row)) {
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
                    onClick={() => form.handleSubmit()}
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
                  form.reset();
                }}
              />
            </HStack>
          );
        }

        if (isApproved) return null;

        return (
          <HStack gap={2} justify="end">
            <IconButton
              size="sm"
              variant="secondary"
              label="Edit"
              icon={<Pencil size={16} />}
              isDisabled={!!editingId}
              onClick={() => setEditingId(row.requirement_id)}
            />
            <IconButton
              size="sm"
              variant="destructive"
              label="Hapus"
              icon={<Trash2 size={16} />}
              isDisabled={!!editingId}
              onClick={() => setDeletingId(row.requirement_id)}
            />
          </HStack>
        );
      },
    },
  ];

  return isApproved ? baseColumns.slice(0, -1) : baseColumns;
}
