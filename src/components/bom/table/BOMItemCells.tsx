import { HStack, IconButton, NumberInput, Selector, VStack } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { EntityCode } from "@/components/shared/EntityCode";
import { useMasterStore } from "@/store/useMasterStore";
import { useBOMStore } from "@/store/useBOMStore";
import type { useBOMForm } from "@/components/bom/form/useBOMForm";
import type { ItemWithDetails } from "@/db/repositories";

interface BaseCellProps {
  form: ReturnType<typeof useBOMForm>["form"];
}

interface ItemSelectorCellProps extends BaseCellProps {
  items: ItemWithDetails[];
  handleItemChange: (v: string) => void;
  onAddNewItem: () => void;
}

export function ItemSelectorCell({
  form,
  items,
  handleItemChange,
  onAddNewItem,
}: ItemSelectorCellProps) {
  return (
    <HStack gap={1} align="start" width="100%">
      <VStack width="100%">
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
                label: it.item_name,
                value: it.item_id,
              }))}
              statusVariant="tooltip"
              status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
            />
          )}
        </form.Field>
      </VStack>
      <IconButton
        variant="secondary"
        label="Tambah Item Baru"
        icon={<Plus size={16} />}
        onClick={onAddNewItem}
      />
    </HStack>
  );
}

export function UnitDisplayCell({
  form,
  items,
}: Omit<ItemSelectorCellProps, "handleItemChange" | "onAddNewItem">) {
  return (
    <form.Subscribe selector={(s) => s.values.item_id}>
      {(itemId) => {
        const selected = items.find((i) => i.item_id === itemId);
        return <span>{selected?.unit_name || "-"}</span>;
      }}
    </form.Subscribe>
  );
}

export function ItemCodeDisplayCell({
  form,
  items,
}: Omit<ItemSelectorCellProps, "handleItemChange" | "onAddNewItem">) {
  return (
    <form.Subscribe selector={(s) => s.values.item_id}>
      {(itemId) => {
        const selected = items.find((i) => i.item_id === itemId);

        if (!selected) {
          return <span>-</span>;
        }

        const code =
          `${selected.category_prefix || ""} ${selected.category_code || ""} ${selected.item_code || ""}`.trim();

        return code ? <EntityCode id={code} /> : <span>-</span>;
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
          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
        />
      )}
    </form.Field>
  );
}

interface PriceSelectorCellProps extends BaseCellProps {
  onAddNewPrice: () => void;
  editingId: string;
}

export function PriceSelectorCell({ form, onAddNewPrice, editingId }: PriceSelectorCellProps) {
  const { itemPricesMap } = useMasterStore(),
    { boms } = useBOMStore();

  return (
    <form.Subscribe
      selector={(s) => ({ groupId: s.values.bom_group_id, itemId: s.values.item_id })}
    >
      {({ itemId, groupId }) => {
        let priceOptions: { value: string; label: string }[] = [];

        if (itemId) {
          const prices = itemPricesMap.get(itemId) || [];

          const usedIds = new Set(
            boms
              .filter(
                (b) =>
                  b.item_id === itemId &&
                  b.bom_id !== editingId &&
                  (b.bom_group_id || "") === (groupId || ""),
              )
              .map((b) => b.item_price_id),
          );

          priceOptions = prices
            .filter((p) => !usedIds.has(p.item_price_id))
            .map((p) => ({
              label: formatNumber(p.price),
              value: p.item_price_id,
            }));
        }

        return (
          <HStack gap={1} align="start" width="100%">
            <VStack width="100%">
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
                    status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                  />
                )}
              </form.Field>
            </VStack>
            <IconButton
              variant="secondary"
              icon={<Plus size={16} />}
              label="Tambah Harga Baru"
              onClick={onAddNewPrice}
              isDisabled={!itemId}
              aria-label="Tambah Harga Baru"
            />
          </HStack>
        );
      }}
    </form.Subscribe>
  );
}

// We don't need editingId here since it doesn't affect the calculation
export function TotalEstimationCell({ form }: BaseCellProps) {
  const { itemPricesMap } = useMasterStore();

  return (
    <form.Subscribe
      selector={(s) => ({
        itemId: s.values.item_id,
        priceId: s.values.item_price_id,
        qty: s.values.qty,
      })}
    >
      {({ qty, priceId, itemId }) => {
        let priceNum = 0;
        if (itemId && priceId) {
          const prices = itemPricesMap.get(itemId) || [],
            priceObj = prices.find((p) => p.item_price_id === priceId);
          if (priceObj) {
            priceNum = priceObj.price;
          }
        }
        return formatNumber(qty * priceNum);
      }}
    </form.Subscribe>
  );
}
