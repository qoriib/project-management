import { HStack, IconButton, Selector, VStack } from "@astryxdesign/core";
import { MoreHorizontal } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { useMasterStore } from "@/store/useMasterStore";
import type { BaseCellProps } from "./types";

interface PriceSelectorCellProps extends BaseCellProps {
  onAddNewPrice: () => void;
  editingId: string;
}

export function PriceSelectorCell({ form, onAddNewPrice, editingId: _ }: PriceSelectorCellProps) {
  const { itemPricesMap } = useMasterStore();

  return (
    <form.Subscribe selector={(s) => ({ itemId: s.values.item_id })}>
      {({ itemId }) => {
        const prices = itemId ? (itemPricesMap.get(itemId) ?? []) : [];
        const priceOptions = prices.map((p) => ({
          label: formatNumber(p.price),
          value: p.item_price_id,
        }));

        return (
          <HStack gap={1} align="start" width="100%">
            <VStack width="100%">
              <form.Field name="item_price_id">
                {(field) => (
                  <Selector
                    isLabelHidden
                    label="Harga"
                    statusVariant="tooltip"
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v as string)}
                    onBlur={field.handleBlur}
                    options={priceOptions}
                    isDisabled={priceOptions.length === 0}
                    status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                  />
                )}
              </form.Field>
            </VStack>
            <IconButton
              variant="secondary"
              icon={<MoreHorizontal size={16} />}
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
