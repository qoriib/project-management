import { HStack, IconButton, VStack, Selector } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { useMasterStore } from "@/store/useMasterStore";
import type { CellFormProps } from "./types";

interface PriceSelectorCellProps extends CellFormProps {
  onAddNewPrice: () => void;
}

export function PriceSelectorCell({
  form,
  onAddNewPrice,
}: PriceSelectorCellProps) {
  const { itemPricesMap } = useMasterStore();

  return (
    <form.Subscribe selector={(s) => s.values.item_id}>
      {(itemId) => {
        let priceOptions: { value: string; label: string }[] = [];

        if (itemId) {
          const prices = itemPricesMap.get(itemId) || [];
          priceOptions = prices.map((p) => ({
            label: formatNumber(p.price),
            value: String(p.item_price_id),
          }));
        }

        return (
          <HStack gap={1} align="start" width="100%">
            <VStack width="100%">
              <form.Field name="item_price_id">
                {(field) => (
                  <Selector
                    label="Harga"
                    isLabelHidden
                    placeholder={
                      itemId
                        ? priceOptions.length === 0
                          ? "Belum ada harga"
                          : "Pilih harga..."
                        : "Pilih item dahulu..."
                    }
                    options={priceOptions}
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={field.handleBlur}
                    statusVariant="tooltip"
                    status={getFieldError(
                      field.state.meta.errors,
                      field.state.meta.isTouched,
                    )}
                    isDisabled={!itemId}
                  />
                )}
              </form.Field>
            </VStack>
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
    </form.Subscribe>
  );
}
