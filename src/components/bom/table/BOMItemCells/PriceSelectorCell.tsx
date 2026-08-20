import { HStack, IconButton, Selector, VStack } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { useMasterStore } from "@/store/useMasterStore";
import { useBOMStore } from "@/store/useBOMStore";
import type { BaseCellProps } from "./types";

interface PriceSelectorCellProps extends BaseCellProps {
  onAddNewPrice: () => void;
  editingId: string;
}

export function PriceSelectorCell({
  form,
  onAddNewPrice,
  editingId,
}: PriceSelectorCellProps) {
  const { itemPricesMap } = useMasterStore(),
    { boms } = useBOMStore();

  return (
    <form.Subscribe
      selector={(s) => ({
        groupId: s.values.bom_group_id,
        itemId: s.values.item_id,
      })}
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
                    status={getFieldError(
                      field.state.meta.errors,
                      field.state.meta.isTouched,
                    )}
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
