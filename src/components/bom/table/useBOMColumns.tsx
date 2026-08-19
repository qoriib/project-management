import { Check, Pencil, Trash2, X } from "lucide-react";
import { HStack, IconButton, Text } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatNumber } from "@/utils/formatters";
import { useBOMForm } from "@/components/bom/form/useBOMForm";
import {
  ItemCodeDisplayCell,
  ItemSelectorCell,
  PriceSelectorCell,
  QtyInputCell,
  TotalEstimationCell,
  UnitDisplayCell,
} from "@/components/bom/table/BOMItemCells";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { BOMDetail, ItemWithDetails } from "@/db/repositories";

export interface BomRow extends BOMDetail, Record<string, unknown> {
  isFooter?: boolean;
  isDraft?: boolean;
}

interface UseBOMColumnsProps {
  editingId: string | null;
  form: ReturnType<typeof useBOMForm>["form"];
  items: ItemWithDetails[];
  handleItemChange: (itemId: string) => void;
  setIsItemFormOpen: (open: boolean) => void;
  setIsPriceFormOpen: (open: boolean) => void;
  setEditingId: (id: string | null) => void;
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
  setDeleteTarget,
  isApproved,
}: UseBOMColumnsProps) {
  const baseColumns: TableColumn<BomRow>[] = [
    {
      header: "Kode Item",
      key: "item_code_full",
      width: pixel(160),
      renderCell: (row: BomRow) => {
        if (row.isFooter) {
          return <div />;
        }

        if (row.bom_id === editingId) {
          return <ItemCodeDisplayCell form={form} items={items} />;
        }

        const code =
          `${row.category_prefix ?? ""} ${row.category_code ?? ""} ${row.item_code ?? ""}`.trim();

        return code ? <EntityCode id={code} /> : "-";
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(1),
      renderCell: (row: BomRow) => {
        if (row.isFooter) {
          return <div />;
        }

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
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(80),
      renderCell: (row: BomRow) => {
        if (row.isFooter) {
          return <div />;
        }

        if (row.bom_id === editingId) {
          return <UnitDisplayCell form={form} items={items} />;
        }

        return row.unit ?? "-";
      },
    },
    {
      align: "end",
      header: "Subtotal (Rp)",
      key: "subtotal",
      width: pixel(220),
      renderCell: (row: BomRow) => {
        if (row.isFooter) {
          return (
            <Text type="code" weight="bold">
              {formatNumber(row.price)}
            </Text>
          );
        }

        const subtotal = (row.qty ?? 0) * (row.price ?? 0);

        return (
          <Text type="code" weight="medium">
            {formatNumber(subtotal)}
          </Text>
        );
      },
    },
    {
      align: "end",
      header: "Volume Rencana",
      key: "qty",
      width: pixel(140),
      renderCell: (row: BomRow) => {
        if (row.isFooter) {
          return <div />;
        }

        if (row.bom_id === editingId) {
          return <QtyInputCell form={form} />;
        }

        return <Text type="code">{formatNumber(row.qty, 6)}</Text>;
      },
    },
    {
      align: "end",
      header: "Harga Rencana (Rp)",
      key: "price",
      width: pixel(220),
      renderCell: (row: BomRow) => {
        if (row.isFooter) {
          return <div />;
        }

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
    },
    {
      align: "end",
      header: "Total Estimasi (Rp)",
      key: "estimation",
      width: pixel(260),
      renderCell: (row: BomRow) => {
        if (row.isFooter) {
          return <div />;
        }

        if (row.bom_id === editingId) {
          return <TotalEstimationCell form={form} />;
        }

        return <Text type="code">{formatNumber(row.estimated_total ?? 0)}</Text>;
      },
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(100),
      renderCell: (row: BomRow) => {
        if (row.isFooter) {
          return <div />;
        }

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
    },
  ];

  return isApproved ? baseColumns.slice(0, -1) : baseColumns;
}
