import { Selector, NumberInput } from "@astryxdesign/core";
import { formatRupiah } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import type { useBOMForm } from "./form/useBOMForm";

interface BaseCellProps {
  form: ReturnType<typeof useBOMForm>["form"];
}

interface ItemSelectorCellProps extends BaseCellProps {
  items: { item_id: string; item_name: string; unit_name?: string }[];
  handleItemChange: (v: string) => void;
}

export function ItemSelectorCell({ form, items, handleItemChange }: ItemSelectorCellProps) {
  return (
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
            label: `${it.item_name} (${it.unit_name || ""})`,
          }))}
          statusVariant="tooltip"
          status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
        />
      )}
    </form.Field>
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
          statusVariant="tooltip"
          status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
        />
      )}
    </form.Field>
  );
}

interface PriceSelectorCellProps extends BaseCellProps {
  priceOptions: { value: string; label: string }[];
}

export function PriceSelectorCell({ form, priceOptions }: PriceSelectorCellProps) {
  return (
    <form.Field name="item_price_id">
      {(field) => (
        <Selector
          isLabelHidden
          label="Harga"
          placeholder="Pilih item terlebih dahulu..."
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
        return formatRupiah(qty * priceNum);
      }}
    </form.Subscribe>
  );
}
