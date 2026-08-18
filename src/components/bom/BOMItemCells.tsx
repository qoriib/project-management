import { Selector, NumberInput, HStack, IconButton } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { EntityCode } from "@/components/shared/EntityCode";
import type { useBOMForm } from "./form/useBOMForm";

interface BaseCellProps {
  form: ReturnType<typeof useBOMForm>["form"];
}

interface ItemSelectorCellProps extends BaseCellProps {
  items: { item_id: string; item_name: string; unit_name?: string }[];
  handleItemChange: (v: string) => void;
  onAddNewItem: () => void;
}

export function ItemSelectorCell({ form, items, handleItemChange, onAddNewItem }: ItemSelectorCellProps) {
  return (
    <HStack gap={1} align="start" width="100%">
      <div style={{ flex: 1 }}>
        <form.Field name="item_id">
          {(field) => (
            <Selector
              isLabelHidden
              label="Item"
              hasSearch
              placeholder="Pilih item..."
              value={field.state.value}
              onChange={(v) => handleItemChange(v)}
              onBlur={field.handleBlur}
              options={items.map((it) => ({
                value: it.item_id,
                label: it.item_name,
              }))}
              statusVariant="tooltip"
              status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
            />
          )}
        </form.Field>
      </div>
      <IconButton
        variant="secondary"
        icon={<Plus size={16} />}
        label="Tambah Item Baru"
        onClick={onAddNewItem}
        aria-label="Tambah Item Baru"
      />
    </HStack>
  );
}

export function UnitDisplayCell({ form, items }: Omit<ItemSelectorCellProps, "handleItemChange" | "onAddNewItem">) {
  return (
    <form.Subscribe selector={(s) => s.values.item_id}>
      {(itemId) => {
        const selected = items.find(i => i.item_id === itemId);
        return <span>{selected?.unit_name || "-"}</span>;
      }}
    </form.Subscribe>
  );
}

export function ItemCodeDisplayCell({ form, items }: Omit<ItemSelectorCellProps, "handleItemChange" | "onAddNewItem">) {
  return (
    <form.Subscribe selector={(s) => s.values.item_id}>
      {(itemId) => {
        const selected = items.find(i => i.item_id === itemId) as any;
        if (!selected) return <span>-</span>;
        const code = `${selected.category_prefix || ""} ${selected.category_code || ""} ${selected.item_code || ""}`.trim();
        return code ? <EntityCode prefix="" id={code} /> : <span>-</span>;
      }}
    </form.Subscribe>
  );
}

export function QtyInputCell({ form }: BaseCellProps) {
  return (
    <form.Field name="qty">
      {(field) => (
        <NumberInput
          isLabelHidden
          label="Volume"
          placeholder="Contoh: 100"
          value={field.state.value}
          onChange={(v) => field.handleChange(v ?? 0)}
          onBlur={field.handleBlur}
          min={0}
          step={0.000001}
          statusVariant="tooltip"
          status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
        />
      )}
    </form.Field>
  );
}

interface PriceSelectorCellProps extends BaseCellProps {
  priceOptions: { value: string; label: string }[];
  onAddNewPrice: () => void;
}

export function PriceSelectorCell({ form, priceOptions, onAddNewPrice }: PriceSelectorCellProps) {
  return (
    <HStack gap={1} align="start" width="100%">
      <div style={{ flex: 1 }}>
        <form.Field name="item_price_id">
          {(field) => (
            <Selector
              isLabelHidden
              label="Harga"
              placeholder="Pilih harga..."
              value={field.state.value}
              onChange={(v) => field.handleChange(v)}
              onBlur={field.handleBlur}
              options={priceOptions}
              isDisabled={priceOptions.length === 0}
              statusVariant="tooltip"
              status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
            />
          )}
        </form.Field>
      </div>
      <form.Subscribe selector={(s) => s.values.item_id}>
        {(itemId) => (
          <IconButton
            variant="secondary"
            icon={<Plus size={16} />}
            label="Tambah Harga Baru"
            onClick={onAddNewPrice}
            isDisabled={!itemId}
            aria-label="Tambah Harga Baru"
          />
        )}
      </form.Subscribe>
    </HStack>
  );
}

interface TotalEstimasiCellProps extends BaseCellProps {
  priceOptions: { value: string; label: string }[];
}

export function TotalEstimasiCell({ form, priceOptions }: TotalEstimasiCellProps) {
  return (
    <form.Subscribe selector={(s) => ({ qty: s.values.qty, priceId: s.values.item_price_id })}>
      {({ qty, priceId }) => {
        const activePrice = priceOptions.find(p => p.value === priceId)?.label;
        const priceNum = activePrice ? Number(activePrice.replace(/[^0-9,-]+/g, "")) : 0;
        return formatNumber(qty * priceNum);
      }}
    </form.Subscribe>
  );
}
