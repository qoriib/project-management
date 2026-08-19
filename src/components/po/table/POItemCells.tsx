import { HStack, IconButton, Text, VStack } from "@astryxdesign/core";
import { Selector } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { Check, Plus, X } from "lucide-react";
import type { usePOItemForm } from "@/components/po/form/usePOItemForm";
import type { ItemPrice, Vendor } from "@/db/repositories";
import type { BOMReportItem } from "@/db/services/report.service";

export interface CellFormProps {
  form: ReturnType<typeof usePOItemForm>["form"];
}

interface ItemSelectorCellProps extends CellFormProps {
  bomOptions: BOMReportItem[];
  selectedItemIds: Set<string>;
  onChangeItem: (itemId: string) => Promise<void>;
  editingId: string | null;
}

export function ItemSelectorCell({
  form,
  bomOptions,
  selectedItemIds,
  onChangeItem,
  editingId,
}: ItemSelectorCellProps) {
  return (
    <form.Field name="item_id">
      {(field) => {
        const currentVal = field.state.value,
          options = bomOptions
            .filter(
              (b) =>
                b.item_id === currentVal ||
                !selectedItemIds.has(b.item_id) ||
                editingId !== "new-item",
            )
            .map((b) => ({
              label: `${b.item_name} (${b.unit ?? ""})`,
              value: b.item_id,
            }));

        return (
          <Selector
            label="Item"
            isLabelHidden
            hasSearch
            placeholder="Pilih Item..."
            statusVariant="tooltip"
            value={field.state.value}
            options={options}
            onChange={(v) => onChangeItem(v)}
            onBlur={field.handleBlur}
            status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
          />
        );
      }}
    </form.Field>
  );
}

interface PriceSelectorCellProps extends CellFormProps {
  itemId: string;
  prices: ItemPrice[];
  onAddNewPrice: () => void;
}

export function PriceSelectorCell({ form, itemId, prices, onAddNewPrice }: PriceSelectorCellProps) {
  return (
    <form.Field name="item_price_id">
      {(field) => {
        const options = prices.map((p) => ({
          label: formatNumber(p.price),
          value: String(p.item_price_id),
        }));

        return (
          <HStack gap={2} align="center">
            <div style={{ flex: 1 }}>
              <Selector
                label="Harga"
                isLabelHidden
                placeholder={
                  itemId
                    ? prices.length === 0
                      ? "Belum ada harga"
                      : "Pilih harga..."
                    : "Pilih item dahulu..."
                }
                options={options}
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                statusVariant="tooltip"
                status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                isDisabled={!itemId}
              />
            </div>
            <IconButton
              type="button"
              variant="secondary"
              icon={<Plus size={16} />}
              label="Tambah Harga"
              onClick={onAddNewPrice}
              isDisabled={!itemId}
            />
          </HStack>
        );
      }}
    </form.Field>
  );
}

interface VendorSelectorCellProps extends CellFormProps {
  vendors: Vendor[];
  onAddNewVendor: () => void;
}

export function VendorSelectorCell({ form, vendors, onAddNewVendor }: VendorSelectorCellProps) {
  return (
    <form.Field name="vendor_id">
      {(field) => {
        const options = vendors.map((v) => ({
          label: v.vendor_name,
          value: String(v.vendor_id),
        }));

        return (
          <HStack gap={2} align="center">
            <div style={{ flex: 1 }}>
              <Selector
                label="Vendor"
                isLabelHidden
                placeholder="Pilih vendor..."
                options={options}
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                statusVariant="tooltip"
                status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
              />
            </div>
            <IconButton
              type="button"
              variant="secondary"
              icon={<Plus size={16} />}
              label="Tambah Vendor"
              onClick={onAddNewVendor}
            />
          </HStack>
        );
      }}
    </form.Field>
  );
}

interface QtyInputCellProps extends CellFormProps {}

export function QtyInputCell({ form }: QtyInputCellProps) {
  return (
    <form.Field name="qty">
      {(field) => (
        <NumberInput
          label="Volume"
          isLabelHidden
          value={field.state.value}
          onChange={(v) => field.handleChange(v || 0)}
          onBlur={field.handleBlur}
          statusVariant="tooltip"
          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
        />
      )}
    </form.Field>
  );
}

export function EditActionsCell({
  onCancel,
  onSave,
  isSubmitting,
}: {
  onCancel: () => void;
  onSave: () => void;
  isSubmitting: boolean;
}) {
  return (
    <HStack gap={2} justify="end">
      <IconButton
        icon={<Check size={16} />}
        size="sm"
        type="button"
        label="Simpan"
        onClick={onSave}
        isLoading={isSubmitting}
      />
      <IconButton
        icon={<X size={16} />}
        size="sm"
        variant="secondary"
        type="button"
        label="Batal"
        onClick={onCancel}
        isDisabled={isSubmitting}
      />
    </HStack>
  );
}

export function BomInfoCell({
  totalOrdered,
  plannedVolume,
  unit,
}: {
  totalOrdered: number;
  plannedVolume: number;
  unit: string;
}) {
  return (
    <VStack gap={0.5}>
      <Text weight="medium">
        Realisasi: {formatNumber(totalOrdered, 2)} {unit}
      </Text>
      <Text size="sm" color="secondary">
        Rencana: {formatNumber(plannedVolume, 2)} {unit}
      </Text>
    </VStack>
  );
}
